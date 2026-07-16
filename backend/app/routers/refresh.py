from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Reading
from app.schemas import RefreshResult
from app.seed import parse_message
from app.telegram_refresh import fetch_public_preview_messages

router = APIRouter(prefix="/api", tags=["refresh"])


@router.post("/refresh", response_model=RefreshResult)
def refresh_readings(db: Session = Depends(get_db)):
    try:
        raw_messages = fetch_public_preview_messages()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Не удалось получить данные из Telegram: {exc}") from exc

    added = 0
    for raw in raw_messages:
        parsed = parse_message(raw)
        if parsed is None:
            continue

        exists = (
            db.query(Reading.id)
            .filter(Reading.measured_at == parsed["measured_at"], Reading.location == parsed["location"])
            .first()
        )
        if exists is not None:
            continue

        db.add(Reading(**parsed))
        added += 1

    db.commit()

    latest = db.query(Reading).order_by(Reading.measured_at.desc()).first()
    return RefreshResult(
        checked=len(raw_messages),
        added=added,
        latest_measured_at=latest.measured_at if latest else None,
    )
