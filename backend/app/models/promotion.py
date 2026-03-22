from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base


class Promotion(Base):
    __tablename__ = "promotions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    status = Column(String, nullable=False)     # "active" | "scheduled" | "completed"
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=False)
    category = Column(String, nullable=False)
    impact = Column(String, nullable=True)
    forecast_adjusted = Column(Boolean, default=False)
    revenue = Column(String, nullable=True)
