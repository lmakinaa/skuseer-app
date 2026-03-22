from pydantic import BaseModel
from typing import Optional


class KPI(BaseModel):
    label: str
    value: str
    delta: str
    positive: bool


class ChartDataPoint(BaseModel):
    date: str
    actual: Optional[float] = None
    forecast: Optional[float] = None
    upper: Optional[float] = None
    lower: Optional[float] = None


class ForecastChartResponse(BaseModel):
    data: list[ChartDataPoint]
    today_marker: str  # e.g. "Aug 25" — label where actual data ends


class WeatherInsight(BaseModel):
    label: str
    value: str
    detail: str


class EventInsight(BaseModel):
    label: str
    date: str
    impact: str
    detail: str


class PromoInsight(BaseModel):
    label: str
    date: str
    spike: str
    note: str


class InsightsResponse(BaseModel):
    weather: list[WeatherInsight]
    events: list[EventInsight]
    promos: list[PromoInsight]


class TopProduct(BaseModel):
    name: str
    sku: str
    forecast: str   # pre-formatted: "2,340 units"
    change: str     # pre-formatted: "+8%"
    positive: bool


class ActivityLogItem(BaseModel):
    time: str
    text: str
    type: str  # "success" | "warning" | "info"
