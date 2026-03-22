from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ForecastModel, Category
from app.schemas.forecast import ForecastModelSchema, CategoryAccuracy

router = APIRouter()


@router.get("/models", response_model=list[ForecastModelSchema])
def get_forecast_models(db: Session = Depends(get_db)):
    models = db.query(ForecastModel).order_by(ForecastModel.accuracy.desc()).all()
    return [ForecastModelSchema.model_validate(m) for m in models]


@router.get("/accuracy-by-category", response_model=list[CategoryAccuracy])
def get_accuracy_by_category(db: Session = Depends(get_db)):
    categories = db.query(Category).order_by(Category.accuracy.desc()).all()
    return [
        CategoryAccuracy(name=c.name, accuracy=c.accuracy, products=c.products)
        for c in categories
    ]
