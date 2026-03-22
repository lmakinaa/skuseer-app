from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import require_permission
from app.auth.context import TenantContext
from app.models import Category
from app.schemas.category import Category as CategorySchema

router = APIRouter()


@router.get("", response_model=list[CategorySchema])
def list_categories(
    ctx: TenantContext = Depends(require_permission("product:read")),
    db: Session = Depends(get_db),
):
    rows = db.query(Category).filter(Category.tenant_id == ctx.tenant.id).all()
    return [CategorySchema.model_validate(c) for c in rows]
