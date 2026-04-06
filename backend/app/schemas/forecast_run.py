from pydantic import BaseModel
from typing import Optional


class ForecastRunListItem(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str
    date: str                          # formatted datetime string
    status: str                        # completed|running|failed
    products: int                      # alias for products_count
    accuracy: Optional[float] = None
    duration: str
    model: str


class ForecastRunResultItem(BaseModel):
    sku: str
    name: str
    forecast: int
    accuracy: float
    status: str   # good|review


class ForecastPointItem(BaseModel):
    sku: str
    date: str
    quantity: float


class ForecastRunDetail(BaseModel):
    id: str
    name: str
    status: str
    launched_at: str
    finished_at: Optional[str] = None
    duration: str
    model: str
    accuracy: Optional[float] = None
    products_count: int
    products: str                      # scope label, e.g. "All Products", "Dairy"
    summary: str
    results: list[ForecastRunResultItem]
    forecast_points: list[ForecastPointItem] = []


class ForecastRunCreate(BaseModel):
    name: str
    model: str = "Smart Forecast"
    product_ids: list[str] = []        # empty = all products


class ForecastRunArchiveRequest(BaseModel):
    run_ids: list[str]


class ForecastRunUnarchiveRequest(BaseModel):
    run_ids: list[str]
