from pydantic import BaseModel
from typing import Literal, Optional


class PromotionCreate(BaseModel):
    name: str
    start_date: str
    end_date: str
    category: str
    impact: Optional[str] = None
    forecast_adjusted: bool = False
    revenue: Optional[str] = None


class PromotionUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[Literal["active", "scheduled", "completed"]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    category: Optional[str] = None
    impact: Optional[str] = None
    forecast_adjusted: Optional[bool] = None
    revenue: Optional[str] = None


class PromotionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    status: Literal["active", "scheduled", "completed"]
    start_date: str
    end_date: str
    category: str
    impact: Optional[str] = None
    forecast_adjusted: bool
    revenue: Optional[str] = None
