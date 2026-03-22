from sqlalchemy import Column, String, Float, Integer, ForeignKey
from app.database import Base


class ForecastModel(Base):
    __tablename__ = "forecast_models"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=True, index=True)
    name = Column(String, nullable=False)           # canonical: "XGBoost"
    display_name = Column(String, nullable=False)   # UI name: "Smart Forecast"
    accuracy = Column(Float, nullable=False)
    status = Column(String, nullable=False)         # "active" | "winner"
    detail = Column(String, nullable=False)


class ChartDataPoint(Base):
    __tablename__ = "chart_data_points"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=True, index=True)
    date = Column(String, nullable=False)
    actual = Column(Float, nullable=True)
    forecast = Column(Float, nullable=True)
    upper = Column(Float, nullable=True)
    lower = Column(Float, nullable=True)
