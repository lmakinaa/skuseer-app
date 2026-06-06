from typing import Optional
from pydantic import BaseModel, Field
from config import (
    DEFAULT_CTC,
    DEFAULT_LON,
    DEFAULT_LAT,
    DEFAULT_HORIZON
)

class SalesRow(BaseModel):
    product_id: str
    date: str = Field(description="Date in YYYY-MM-DD format")
    sales: int = Field(ge=0, description="Quantity sold on that date")


class ForecastRequest(BaseModel):
    sales_data: list[SalesRow] = Field(min_length=1, description="Historical sales rows")
    horizon: int = Field(default=DEFAULT_HORIZON, ge=1, le=90)
    tools: list[str] = Field(default_factory=list)
    country_code: str = Field(default=DEFAULT_CTC)
    longitude: float = Field(default=DEFAULT_LON)
    latitude: float = Field(default=DEFAULT_LAT)


class ProductForecastPoint(BaseModel):
    product_id: str
    date: str
    forecast: float


class ForecastResponse(BaseModel):
    status: str
    horizon: int
    products_count: int
    forecast_points: list[ProductForecastPoint]
    error: Optional[str] = None

