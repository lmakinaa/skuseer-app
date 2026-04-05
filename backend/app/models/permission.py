import uuid
from sqlalchemy import Column, String

from app.database import Base


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    codename = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)


# All permission codenames in the system — dot notation aligned with frontend
ALL_PERMISSIONS = [
    ("dashboard.view", "View dashboard & KPIs"),
    ("dashboard.export", "Export dashboard data"),
    ("products.view", "View products & forecasts"),
    ("products.edit", "Edit product details"),
    ("products.import", "Import / export products"),
    ("products.delete", "Delete products"),
    ("forecasts.view", "View forecast reports"),
    ("forecasts.configure", "Configure forecast models"),
    ("forecasts.retrain", "Trigger model retraining"),
    ("promotions.view", "View promotions"),
    ("promotions.create", "Create & edit promotions"),
    ("promotions.delete", "Delete promotions"),
    ("reports.view", "View reports"),
    ("reports.generate", "Generate new reports"),
    ("reports.schedule", "Schedule automated reports"),
    ("settings.store", "Edit store information"),
    ("settings.members", "Manage team members"),
    ("settings.roles", "Manage roles & permissions"),
    ("settings.integrations", "Manage data sources"),
    ("settings.products", "Manage categories & import"),
]
