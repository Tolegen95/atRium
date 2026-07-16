from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import asc, desc
from sqlalchemy.orm import Session

from app.comfort import comfort_score, status_label, temperature_label
from app.database import get_db
from app.models import Location, Reading
from app.schemas import CurrentStatusOut, ReadingOut

router = APIRouter(prefix="/api", tags=["readings"])


@router.get("/readings", response_model=list[ReadingOut])
def list_readings(
    db: Session = Depends(get_db),
    date_: date | None = Query(default=None, alias="date"),
    location: Location | None = None,
    noise: str | None = None,
    brightness: str | None = None,
    min_temperature: float | None = None,
    max_temperature: float | None = None,
    sort_by: str = Query(default="measured_at", pattern="^(measured_at|temperature)$"),
    order: str = Query(default="desc", pattern="^(asc|desc)$"),
    limit: int = Query(default=500, ge=1, le=5000),
):
    query = db.query(Reading)

    if date_ is not None:
        start = datetime.combine(date_, datetime.min.time())
        end = start + timedelta(days=1)
        query = query.filter(Reading.measured_at >= start, Reading.measured_at < end)
    if location is not None:
        query = query.filter(Reading.location == location)
    if noise is not None:
        query = query.filter(Reading.noise == noise)
    if brightness is not None:
        query = query.filter(Reading.brightness == brightness)
    if min_temperature is not None:
        query = query.filter(Reading.temperature >= min_temperature)
    if max_temperature is not None:
        query = query.filter(Reading.temperature <= max_temperature)

    sort_column = Reading.measured_at if sort_by == "measured_at" else Reading.temperature
    query = query.order_by(asc(sort_column) if order == "asc" else desc(sort_column))

    return query.limit(limit).all()


@router.get("/readings/current", response_model=CurrentStatusOut)
def current_status(db: Session = Depends(get_db)):
    latest_atrium = (
        db.query(Reading)
        .filter(Reading.location == Location.atrium)
        .order_by(desc(Reading.measured_at))
        .first()
    )
    latest_outside = (
        db.query(Reading)
        .filter(Reading.location == Location.outside)
        .order_by(desc(Reading.measured_at))
        .first()
    )

    outside_temp = latest_outside.temperature if latest_outside else None

    if latest_atrium is None:
        return CurrentStatusOut(
            atrium_temperature=None,
            outside_temperature=outside_temp,
            atrium_temperature_label=None,
            outside_temperature_label=temperature_label(outside_temp) if outside_temp is not None else None,
            brightness=None,
            noise=None,
            last_measured_at=None,
            status_label="Нет данных",
            comfort_score=None,
        )

    score = comfort_score(latest_atrium.temperature, latest_atrium.noise, latest_atrium.brightness)
    label = status_label(latest_atrium.temperature, latest_atrium.noise, latest_atrium.brightness)

    return CurrentStatusOut(
        atrium_temperature=latest_atrium.temperature,
        outside_temperature=outside_temp,
        atrium_temperature_label=temperature_label(latest_atrium.temperature),
        outside_temperature_label=temperature_label(outside_temp) if outside_temp is not None else None,
        brightness=latest_atrium.brightness,
        noise=latest_atrium.noise,
        last_measured_at=latest_atrium.measured_at,
        status_label=label,
        comfort_score=score,
    )


@router.get("/readings/{reading_id}", response_model=ReadingOut)
def get_reading(reading_id: int, db: Session = Depends(get_db)):
    reading = db.query(Reading).filter(Reading.id == reading_id).first()
    if reading is None:
        raise HTTPException(status_code=404, detail="Reading not found")
    return reading
