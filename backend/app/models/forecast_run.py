import uuid
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Text, ForeignKey, func,
)
from app.database import Base


class ForecastRun(Base):
    __tablename__ = "forecast_runs"

    id = Column(String, primary_key=True, default=lambda: f"FC-{uuid.uuid4().hex[:6].upper()}")
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    status = Column(String, nullable=False, default="queued")  # queued|running|completed|failed
    model = Column(String, nullable=False, default="Smart Forecast")
    products_scope = Column(String, nullable=False, default="All Products")
    products_count = Column(Integer, nullable=False, default=0)
    accuracy = Column(Float, nullable=True)
    duration = Column(String, nullable=True)
    summary = Column(Text, nullable=True)
    launched_at = Column(DateTime, nullable=False, server_default=func.now())
    finished_at = Column(DateTime, nullable=True)


class ForecastRunResult(Base):
    __tablename__ = "forecast_run_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String, ForeignKey("forecast_runs.id"), nullable=False, index=True)
    product_id = Column(String, nullable=False)
    product_name = Column(String, nullable=False)
    forecast = Column(Integer, nullable=False)
    accuracy = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="good")  # good|review
