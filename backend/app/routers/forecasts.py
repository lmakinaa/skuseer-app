from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import require_permission
from app.auth.context import TenantContext
from app.models import ForecastModel, Category
from app.schemas.forecast import ForecastModelSchema, CategoryAccuracy

router = APIRouter()


@router.get("/models", response_model=list[ForecastModelSchema])
def get_forecast_models(
    ctx: TenantContext = Depends(require_permission("forecast:read")),
    db: Session = Depends(get_db),
):
    models = (
        db.query(ForecastModel)
        .filter(ForecastModel.tenant_id == ctx.tenant.id)
        .order_by(ForecastModel.accuracy.desc())
        .all()
    )
    return [ForecastModelSchema.model_validate(m) for m in models]


@router.get("/accuracy-by-category", response_model=list[CategoryAccuracy])
def get_accuracy_by_category(
    ctx: TenantContext = Depends(require_permission("forecast:read")),
    db: Session = Depends(get_db),
):
    categories = (
        db.query(Category)
        .filter(Category.tenant_id == ctx.tenant.id)
        .order_by(Category.accuracy.desc())
        .all()
    )
    return [
        CategoryAccuracy(name=c.name, accuracy=c.accuracy, products=c.products)
        for c in categories
    ]
