from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Category
from app.schemas.category import Category as CategorySchema

router = APIRouter()


@router.get("", response_model=list[CategorySchema])
def list_categories(db: Session = Depends(get_db)):
    return [CategorySchema.model_validate(c) for c in db.query(Category).all()]
