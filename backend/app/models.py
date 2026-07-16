import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Location(str, enum.Enum):
    atrium = "atrium"
    outside = "outside"


class ReportCategory(str, enum.Enum):
    too_hot = "too_hot"
    too_noisy = "too_noisy"
    too_bright = "too_bright"
    too_dark = "too_dark"
    comfortable = "comfortable"
    other = "other"


class ReportStatus(str, enum.Enum):
    open = "open"
    resolved = "resolved"


class Reading(Base):
    __tablename__ = "readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    measured_at: Mapped[datetime] = mapped_column(DateTime, index=True, nullable=False)
    location: Mapped[Location] = mapped_column(Enum(Location), index=True, nullable=False)
    temperature: Mapped[float] = mapped_column(Float, nullable=False)
    brightness: Mapped[str | None] = mapped_column(String(32), nullable=True)
    noise: Mapped[str | None] = mapped_column(String(32), nullable=True)


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    category: Mapped[ReportCategory] = mapped_column(Enum(ReportCategory), nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus), default=ReportStatus.open, nullable=False
    )
