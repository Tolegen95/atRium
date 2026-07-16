from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.comfort import temperature_label
from app.models import Location, ReportCategory, ReportStatus


class ReadingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    measured_at: datetime
    location: Location
    temperature: float
    brightness: str | None
    noise: str | None

    @computed_field
    @property
    def temperature_label(self) -> str:
        return temperature_label(self.temperature)


class CurrentStatusOut(BaseModel):
    atrium_temperature: float | None
    outside_temperature: float | None
    atrium_temperature_label: str | None
    outside_temperature_label: str | None
    brightness: str | None
    noise: str | None
    last_measured_at: datetime | None
    status_label: str
    comfort_score: float | None


class SummaryOut(BaseModel):
    date: str
    min_temperature: float | None
    max_temperature: float | None
    avg_temperature: float | None
    coolest_time: datetime | None
    quietest_time: datetime | None
    best_study_period: str | None
    hottest_period: str | None
    uncomfortable_readings_count: int
    avg_inside_outside_diff: float | None
    comfort_score: float | None


class RefreshResult(BaseModel):
    checked: int
    added: int
    latest_measured_at: datetime | None


class ReportBase(BaseModel):
    category: ReportCategory
    comment: str | None = Field(default=None, max_length=1000)


class ReportCreate(ReportBase):
    pass


class ReportUpdate(BaseModel):
    category: ReportCategory | None = None
    comment: str | None = Field(default=None, max_length=1000)
    status: ReportStatus | None = None


class ReportOut(ReportBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    status: ReportStatus
