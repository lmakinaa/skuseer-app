from pydantic import BaseModel
from typing import Literal, Optional


class ReportGenerateRequest(BaseModel):
    name: str
    type: str
    recipients: str


class ReportScheduleRequest(BaseModel):
    name: str
    type: str
    recipients: str
    scheduled_date: str  # ISO date


class ReportResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    type: str
    date: str
    status: Literal["delivered", "scheduled", "generating"]
    recipients: str
