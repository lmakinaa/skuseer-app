from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.auth.dependencies import require_permission
from app.auth.context import TenantContext
from app.models import Promotion
from app.schemas.promotion import PromotionCreate, PromotionUpdate, PromotionResponse

router = APIRouter()


@router.get("", response_model=list[PromotionResponse])
def list_promotions(
    status: Optional[str] = Query(default=None, description="Filter by status: active|scheduled|completed"),
    ctx: TenantContext = Depends(require_permission("promotions.view")),
    db: Session = Depends(get_db),
):
    query = db.query(Promotion).filter(Promotion.tenant_id == ctx.tenant.id)
    if status:
        query = query.filter(Promotion.status == status)
    return [PromotionResponse.model_validate(p) for p in query.all()]


@router.post("", response_model=PromotionResponse, status_code=201)
def create_promotion(
    body: PromotionCreate,
    ctx: TenantContext = Depends(require_permission("promotions.create")),
    db: Session = Depends(get_db),
):
    promo = Promotion(**body.model_dump(), status="scheduled", tenant_id=ctx.tenant.id)
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return PromotionResponse.model_validate(promo)


@router.patch("/{promotion_id}", response_model=PromotionResponse)
def update_promotion(
    promotion_id: int,
    body: PromotionUpdate,
    ctx: TenantContext = Depends(require_permission("promotions.create")),
    db: Session = Depends(get_db),
):
    promo = db.query(Promotion).filter(
        Promotion.id == promotion_id,
        Promotion.tenant_id == ctx.tenant.id,
    ).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(promo, field, value)
    db.commit()
    db.refresh(promo)
    return PromotionResponse.model_validate(promo)


@router.delete("/{promotion_id}", status_code=204)
def delete_promotion(
    promotion_id: int,
    ctx: TenantContext = Depends(require_permission("promotions.delete")),
    db: Session = Depends(get_db),
):
    promo = db.query(Promotion).filter(
        Promotion.id == promotion_id,
        Promotion.tenant_id == ctx.tenant.id,
    ).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")
    db.delete(promo)
    db.commit()
