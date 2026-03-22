from sqlalchemy import Column, String, DateTime
from app.database import Base


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(String, primary_key=True)           # "weather", "holidays", etc.
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    status = Column(String, nullable=False)         # "connected" | "disconnected"
    last_synced_at = Column(DateTime, nullable=True)
    data_points = Column(String, nullable=False)
    impact = Column(String, nullable=False)
