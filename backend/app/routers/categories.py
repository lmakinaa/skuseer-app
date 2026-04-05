import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import require_permission
from app.auth.context import TenantContext
from app.models import Category, Subcategory
from app.schemas.category import (
    Category as CategorySchema,
    CategoryResponse,
    CategoryCreate,
    CategoryUpdate,
    SubcategoryCreate,
)

router = APIRouter()


def _build_response(cat: Category, subcats: list[Subcategory]) -> CategoryResponse:
    return CategoryResponse(
        id=cat.id,
        name=cat.name,
        products=cat.products,
        accuracy=cat.accuracy,
        trend=cat.trend,
        subcategories=[s.name for s in subcats],
    )


@router.get("", response_model=list[CategoryResponse])
def list_categories(
    ctx: TenantContext = Depends(require_permission("products.view")),
    db: Session = Depends(get_db),
):
    cats = db.query(Category).filter(Category.tenant_id == ctx.tenant.id).all()
    result = []
    for cat in cats:
        subcats = db.query(Subcategory).filter(Subcategory.category_id == cat.id).all()
        result.append(_build_response(cat, subcats))
    return result


@router.post("", response_model=CategoryResponse, status_code=201)
def create_category(
    body: CategoryCreate,
    ctx: TenantContext = Depends(require_permission("settings.products")),
    db: Session = Depends(get_db),
):
    existing = db.query(Category).filter(
        Category.tenant_id == ctx.tenant.id, Category.name == body.name
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Category with this name already exists")

    cat = Category(
        id=str(uuid.uuid4()),
        tenant_id=ctx.tenant.id,
        name=body.name,
        products=0,
        accuracy=0.0,
        trend="stable",
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return _build_response(cat, [])


@router.patch("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: str,
    body: CategoryUpdate,
    ctx: TenantContext = Depends(require_permission("settings.products")),
    db: Session = Depends(get_db),
):
    cat = db.query(Category).filter(
        Category.id == category_id, Category.tenant_id == ctx.tenant.id
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    if body.name is not None:
        cat.name = body.name
    db.commit()
    db.refresh(cat)
    subcats = db.query(Subcategory).filter(Subcategory.category_id == cat.id).all()
    return _build_response(cat, subcats)


@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: str,
    ctx: TenantContext = Depends(require_permission("settings.products")),
    db: Session = Depends(get_db),
):
    cat = db.query(Category).filter(
        Category.id == category_id, Category.tenant_id == ctx.tenant.id
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    db.query(Subcategory).filter(Subcategory.category_id == category_id).delete()
    db.delete(cat)
    db.commit()


@router.post("/{category_id}/subcategories", response_model=CategoryResponse, status_code=201)
def add_subcategory(
    category_id: str,
    body: SubcategoryCreate,
    ctx: TenantContext = Depends(require_permission("settings.products")),
    db: Session = Depends(get_db),
):
    cat = db.query(Category).filter(
        Category.id == category_id, Category.tenant_id == ctx.tenant.id
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    sub = Subcategory(id=str(uuid.uuid4()), category_id=category_id, name=body.name)
    db.add(sub)
    db.commit()

    subcats = db.query(Subcategory).filter(Subcategory.category_id == cat.id).all()
    return _build_response(cat, subcats)


@router.delete("/{category_id}/subcategories/{subcategory_id}", status_code=204)
def delete_subcategory(
    category_id: str,
    subcategory_id: str,
    ctx: TenantContext = Depends(require_permission("settings.products")),
    db: Session = Depends(get_db),
):
    cat = db.query(Category).filter(
        Category.id == category_id, Category.tenant_id == ctx.tenant.id
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    sub = db.query(Subcategory).filter(
        Subcategory.id == subcategory_id, Subcategory.category_id == category_id
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subcategory not found")

    db.delete(sub)
    db.commit()
