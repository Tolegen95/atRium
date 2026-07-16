"""Parses the Telegram export (result.json) into Reading rows and loads them into the DB.

Expected raw message text formats (from the NU atrium sensor channel):
  "🏫 Atrium: 🌡 28.00ºC 💡 Dark 🔉 Quiet"
  "🌆 Outside NU: 🌡 21.8°C"

The channel's history spans several years and includes older message formats
(numeric lux/humidity readings, weather-forecast posts, maintenance
announcements) that don't carry the brightness/noise categories the app is
built around. Only messages with a recognizable temperature reading AND an
explicit Atrium/Outside label are imported; brightness and noise are kept
only when they match one of the known category words, otherwise left null.
"""

import json
import math
import os
import re
from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models import Location, Reading

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_RESULT_JSON = os.path.join(BASE_DIR, "result.json")

# The atrium is physically in Astana, Kazakhstan. Sensor timestamps are
# stored as naive local wall-clock time in this zone (handles the country's
# March 2024 UTC+6 -> UTC+5 unification automatically via tzdata).
ATRIUM_TZ = ZoneInfo("Asia/Almaty")

TEMP_RE = re.compile(r"🌡\s*(-?[\d.]+)\s*[°º]\s*C", re.IGNORECASE)
BRIGHTNESS_RE = re.compile(r"💡\s*([^🔉]+?)\s*(?:🔉|$)")
NOISE_RE = re.compile(r"🔉\s*(.+)$")

BRIGHTNESS_CATEGORIES = {"Dark", "Dim", "Normal brightness", "Bright", "Very bright"}
NOISE_CATEGORIES = {"Very quiet", "Quiet", "Mild noise", "Noisy", "Very noisy"}


def _extract_text(message: dict) -> str:
    text = message.get("text", "")
    if isinstance(text, str):
        return text
    if isinstance(text, list):
        parts = []
        for chunk in text:
            if isinstance(chunk, str):
                parts.append(chunk)
            elif isinstance(chunk, dict):
                parts.append(chunk.get("text", ""))
        return "".join(parts)
    return ""


def parse_message(message: dict) -> dict | None:
    text = _extract_text(message).strip()
    if not text:
        return None

    date_str = message.get("date")
    if not date_str:
        return None
    try:
        measured_at = datetime.fromisoformat(date_str)
    except ValueError:
        return None
    if measured_at.tzinfo is not None:
        measured_at = measured_at.astimezone(ATRIUM_TZ).replace(tzinfo=None)

    temp_match = TEMP_RE.search(text)
    if not temp_match:
        return None
    temperature = float(temp_match.group(1))
    if math.isnan(temperature) or not math.isfinite(temperature):
        return None

    is_atrium = "atrium" in text.lower() or "🏫" in text
    is_outside = "outside" in text.lower() or "🌆" in text
    if is_atrium:
        location = Location.atrium
    elif is_outside:
        location = Location.outside
    else:
        return None

    brightness = None
    noise = None
    if location == Location.atrium:
        brightness_match = BRIGHTNESS_RE.search(text)
        if brightness_match:
            candidate = brightness_match.group(1).strip()
            brightness = candidate if candidate in BRIGHTNESS_CATEGORIES else None
        noise_match = NOISE_RE.search(text)
        if noise_match:
            candidate = noise_match.group(1).strip()
            noise = candidate if candidate in NOISE_CATEGORIES else None

    return {
        "measured_at": measured_at,
        "location": location,
        "temperature": temperature,
        "brightness": brightness,
        "noise": noise,
    }


def load_readings_from_file(path: str) -> list[dict]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    messages = data.get("messages", data if isinstance(data, list) else [])
    readings = []
    seen = set()
    for message in messages:
        parsed = parse_message(message)
        if parsed is None:
            continue
        # The channel occasionally posts the exact same reading twice at the
        # same timestamp (bot glitch); keep the first occurrence only.
        dedup_key = (parsed["measured_at"], parsed["location"])
        if dedup_key in seen:
            continue
        seen.add(dedup_key)
        readings.append(parsed)
    return readings


def seed_database(db: Session, path: str | None = None) -> int:
    result_path = path or os.environ.get("RESULT_JSON_PATH", DEFAULT_RESULT_JSON)
    if not os.path.exists(result_path):
        return 0

    readings = load_readings_from_file(result_path)
    for r in readings:
        db.add(Reading(**r))
    db.commit()
    return len(readings)


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        count = seed_database(session)
        print(f"Seeded {count} readings")
    finally:
        session.close()
