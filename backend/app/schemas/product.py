from pydantic import BaseModel
from typing import Optional


class Product(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str
    category: str
    price: float
    forecast: int
    last_month: int
    change: float
    accuracy: float
    stock: int
    reorder_point: int


class ProductListResponse(BaseModel):
    items: list[Product]
    total: int
    page: int
    page_size: int


class ProductChartPoint(BaseModel):
    day: str
    actual: Optional[int] = None
    forecast: Optional[int] = None


class AIInsight(BaseModel):
    text: str
    type: str  # "success" | "warning" | "info"


class ProductDetailResponse(BaseModel):
    product: Product
    chart_data: list[ProductChartPoint]
    insights: list[AIInsight]
