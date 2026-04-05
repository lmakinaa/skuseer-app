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


class ProductCreate(BaseModel):
    id: str
    name: str
    category: str
    price: float
    stock: int
    reorder_point: int
    forecast: int = 0
    last_month: int = 0
    change: float = 0.0
    accuracy: float = 0.0


class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    price: float | None = None
    stock: int | None = None
    reorder_point: int | None = None
    forecast: int | None = None
    last_month: int | None = None
    change: float | None = None
    accuracy: float | None = None


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


class SalesHistoryPoint(BaseModel):
    date: str
    sales: int
