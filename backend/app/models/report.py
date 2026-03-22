from sqlalchemy import Column, Integer, String
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    date = Column(String, nullable=False)       # ISO date
    status = Column(String, nullable=False)     # "delivered" | "scheduled" | "generating"
    recipients = Column(String, nullable=False)
    file_path = Column(String, nullable=True)   # local path to generated file
