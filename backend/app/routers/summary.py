from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.comfort import comfort_score as score_fn
from app.comfort import is_uncomfortable
from app.database import get_db
from app.models import Location, Reading
from app.schemas import SummaryOut

router = APIRouter(prefix="/api", tags=["summary"])


@router.get("/summary", response_model=SummaryOut)
def summary(
    db: Session = Depends(get_db),
    date_: date | None = Query(default=None, alias="date"),
):
    if date_ is None:
        latest = db.query(func.max(Reading.measured_at)).scalar()
        date_ = latest.date() if latest else datetime.utcnow().date()

    start = datetime.combine(date_, datetime.min.time())
    end = start + timedelta(days=1)

    atrium_readings = (
        db.query(Reading)
        .filter(
            Reading.location == Location.atrium,
            Reading.measured_at >= start,
            Reading.measured_at < end,
        )
        .order_by(Reading.measured_at)
        .all()
    )
    outside_readings = (
        db.query(Reading)
        .filter(
            Reading.location == Location.outside,
            Reading.measured_at >= start,
            Reading.measured_at < end,
        )
        .order_by(Reading.measured_at)
        .all()
    )

    if not atrium_readings:
        return SummaryOut(
            date=date_.isoformat(),
            min_temperature=None,
            max_temperature=None,
            avg_temperature=None,
            coolest_time=None,
            quietest_time=None,
            best_study_period=None,
            hottest_period=None,
            uncomfortable_readings_count=0,
            avg_inside_outside_diff=None,
            comfort_score=None,
        )

    temps = [r.temperature for r in atrium_readings]
    min_temperature = min(temps)
    max_temperature = max(temps)
    avg_temperature = round(sum(temps) / len(temps), 1)

    coolest = min(atrium_readings, key=lambda r: r.temperature)

    noise_rank = {"Quiet": 0, "Mild noise": 1, "Noisy": 2}
    quietest_candidates = [r for r in atrium_readings if r.noise is not None]
    quietest = (
        min(quietest_candidates, key=lambda r: noise_rank.get(r.noise, 1))
        if quietest_candidates
        else None
    )

    uncomfortable_count = sum(
        1 for r in atrium_readings if is_uncomfortable(r.temperature, r.noise, r.brightness)
    )

    def hour_label(hour: int) -> str:
        return f"{hour:02d}:00-{(hour + 1) % 24:02d}:00"

    by_hour: dict[int, list[Reading]] = {}
    for r in atrium_readings:
        by_hour.setdefault(r.measured_at.hour, []).append(r)

    hour_avg_temp = {h: sum(x.temperature for x in rs) / len(rs) for h, rs in by_hour.items()}
    hottest_hour = max(hour_avg_temp, key=hour_avg_temp.get)
    hottest_period = hour_label(hottest_hour)

    hour_avg_score = {
        h: sum(score_fn(x.temperature, x.noise, x.brightness) for x in rs) / len(rs)
        for h, rs in by_hour.items()
    }
    best_study_hour = max(hour_avg_score, key=hour_avg_score.get)
    best_study_period = hour_label(best_study_hour)

    avg_diff = None
    if outside_readings:
        outside_by_hour: dict[int, list[float]] = {}
        for r in outside_readings:
            outside_by_hour.setdefault(r.measured_at.hour, []).append(r.temperature)
        diffs = []
        for h, rs in by_hour.items():
            if h in outside_by_hour:
                inside_avg = sum(x.temperature for x in rs) / len(rs)
                outside_avg = sum(outside_by_hour[h]) / len(outside_by_hour[h])
                diffs.append(inside_avg - outside_avg)
        if diffs:
            avg_diff = round(sum(diffs) / len(diffs), 1)

    day_score = round(
        sum(score_fn(r.temperature, r.noise, r.brightness) for r in atrium_readings)
        / len(atrium_readings),
        1,
    )

    return SummaryOut(
        date=date_.isoformat(),
        min_temperature=min_temperature,
        max_temperature=max_temperature,
        avg_temperature=avg_temperature,
        coolest_time=coolest.measured_at,
        quietest_time=quietest.measured_at if quietest else None,
        best_study_period=best_study_period,
        hottest_period=hottest_period,
        uncomfortable_readings_count=uncomfortable_count,
        avg_inside_outside_diff=avg_diff,
        comfort_score=day_score,
    )
