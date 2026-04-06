import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import require_permission
from app.auth.context import TenantContext
from app.models import ForecastModel, Category
from app.models.forecast_run import ForecastRun, ForecastRunResult
from app.schemas.forecast import ForecastModelSchema, CategoryAccuracy
from app.schemas.forecast_run import (
    ForecastRunListItem, ForecastRunDetail, ForecastRunResultItem, ForecastRunCreate,
    ForecastRunArchiveRequest, ForecastRunUnarchiveRequest,
)

router = APIRouter()


@router.get("/models", response_model=list[ForecastModelSchema])
def get_forecast_models(
    ctx: TenantContext = Depends(require_permission("forecasts.view")),
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
    ctx: TenantContext = Depends(require_permission("forecasts.view")),
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


# ── Forecast Runs ─────────────────────────────────────────────────────────────

def _format_datetime(dt: datetime.datetime) -> str:
    return dt.strftime("%b %d, %Y %H:%M") if dt else ""


@router.get("/runs", response_model=list[ForecastRunListItem])
def list_forecast_runs(
    product_id: str = Query(default="", description="Filter by product SKU"),
    include_archived: bool = Query(default=False, description="Include archived runs"),
    ctx: TenantContext = Depends(require_permission("forecasts.view")),
    db: Session = Depends(get_db),
):
    query = db.query(ForecastRun).filter(ForecastRun.tenant_id == ctx.tenant.id)
    if not include_archived:
        query = query.filter(ForecastRun.status != "archived")

    if product_id:
        run_ids = (
            db.query(ForecastRunResult.run_id)
            .filter(ForecastRunResult.product_id == product_id)
            .subquery()
        )
        query = query.filter(ForecastRun.id.in_(run_ids))

    runs = query.order_by(ForecastRun.launched_at.desc()).limit(50).all()
    return [
        ForecastRunListItem(
            id=r.id,
            name=r.name,
            date=_format_datetime(r.launched_at),
            status=r.status,
            products=r.products_count,
            accuracy=r.accuracy,
            duration=r.duration or "—",
            model=r.model,
        )
        for r in runs
    ]


@router.get("/runs/{run_id}", response_model=ForecastRunDetail)
def get_forecast_run(
    run_id: str,
    ctx: TenantContext = Depends(require_permission("forecasts.view")),
    db: Session = Depends(get_db),
):
    run = db.query(ForecastRun).filter(
        ForecastRun.id == run_id,
        ForecastRun.tenant_id == ctx.tenant.id,
    ).first()
    if not run:
        raise HTTPException(status_code=404, detail="Forecast run not found")

    results = (
        db.query(ForecastRunResult)
        .filter(ForecastRunResult.run_id == run_id)
        .all()
    )

    return ForecastRunDetail(
        id=run.id,
        name=run.name,
        status=run.status,
        launched_at=run.launched_at.strftime("%Y-%m-%d %H:%M:%S") if run.launched_at else "",
        finished_at=run.finished_at.strftime("%Y-%m-%d %H:%M:%S") if run.finished_at else None,
        duration=run.duration or "—",
        model=run.model,
        accuracy=run.accuracy,
        products_count=run.products_count,
        products=run.products_scope,
        summary=run.summary or "",
        results=[
            ForecastRunResultItem(
                sku=r.product_id,
                name=r.product_name,
                forecast=r.forecast,
                accuracy=r.accuracy,
                status=r.status,
            )
            for r in results
        ],
    )


@router.post("/runs", response_model=ForecastRunListItem, status_code=201)
def create_forecast_run(
    body: ForecastRunCreate,
    ctx: TenantContext = Depends(require_permission("forecasts.configure")),
    db: Session = Depends(get_db),
):
    """Placeholder: creates a completed run immediately with mock results."""
    from app.models import Product

    if body.product_ids:
        products = (
            db.query(Product)
            .filter(Product.tenant_id == ctx.tenant.id, Product.id.in_(body.product_ids))
            .all()
        )
        scope = f"{len(products)} Selected Products"
    else:
        products = db.query(Product).filter(Product.tenant_id == ctx.tenant.id).all()
        scope = "All Products"

    now = datetime.datetime.utcnow()
    run = ForecastRun(
        tenant_id=ctx.tenant.id,
        name=body.name,
        status="completed",
        model=body.model,
        products_scope=scope,
        products_count=len(products),
        accuracy=round(sum(p.accuracy for p in products) / max(len(products), 1), 1),
        duration="0s (mock)",
        summary=f"Processed {len(products)} SKUs. Placeholder run — no real ML executed.",
        launched_at=now,
        finished_at=now,
    )
    db.add(run)
    db.flush()

    for p in products:
        result = ForecastRunResult(
            run_id=run.id,
            product_id=p.id,
            product_name=p.name,
            forecast=p.forecast,
            accuracy=p.accuracy,
            status="good" if p.accuracy >= 95.0 else "review",
        )
        db.add(result)

    db.commit()
    db.refresh(run)

    return ForecastRunListItem(
        id=run.id,
        name=run.name,
        date=_format_datetime(run.launched_at),
        status=run.status,
        products=run.products_count,
        accuracy=run.accuracy,
        duration=run.duration or "—",
        model=run.model,
    )


@router.post("/runs/{run_id}/archive", response_model=ForecastRunDetail)
def archive_forecast_run(
    run_id: str,
    ctx: TenantContext = Depends(require_permission("forecasts.configure")),
    db: Session = Depends(get_db),
):
    run = db.query(ForecastRun).filter(
        ForecastRun.id == run_id,
        ForecastRun.tenant_id == ctx.tenant.id,
    ).first()
    if not run:
        raise HTTPException(status_code=404, detail="Forecast run not found")

    run.status = "archived"
    if not run.summary:
        run.summary = "Archived run"
    db.commit()
    db.refresh(run)

    results = (
        db.query(ForecastRunResult)
        .filter(ForecastRunResult.run_id == run_id)
        .all()
    )
    return ForecastRunDetail(
        id=run.id,
        name=run.name,
        status=run.status,
        launched_at=run.launched_at.strftime("%Y-%m-%d %H:%M:%S") if run.launched_at else "",
        finished_at=run.finished_at.strftime("%Y-%m-%d %H:%M:%S") if run.finished_at else None,
        duration=run.duration or "—",
        model=run.model,
        accuracy=run.accuracy,
        products_count=run.products_count,
        products=run.products_scope,
        summary=run.summary or "",
        results=[
            ForecastRunResultItem(
                sku=r.product_id,
                name=r.product_name,
                forecast=r.forecast,
                accuracy=r.accuracy,
                status=r.status,
            )
            for r in results
        ],
    )

@router.post("/runs/archive", response_model=list[ForecastRunListItem])
def archive_forecast_runs(
    body: ForecastRunArchiveRequest,
    ctx: TenantContext = Depends(require_permission("forecasts.configure")),
    db: Session = Depends(get_db),
):
    if not body.run_ids:
        return []

    runs = (
        db.query(ForecastRun)
        .filter(ForecastRun.tenant_id == ctx.tenant.id, ForecastRun.id.in_(body.run_ids))
        .all()
    )
    for run in runs:
        run.status = "archived"
        if not run.summary:
            run.summary = "Archived run"

    db.commit()

    return [
        ForecastRunListItem(
            id=r.id,
            name=r.name,
            date=_format_datetime(r.launched_at),
            status=r.status,
            products=r.products_count,
            accuracy=r.accuracy,
            duration=r.duration or "—",
            model=r.model,
        )
        for r in runs
    ]


@router.post("/runs/{run_id}/unarchive", response_model=ForecastRunDetail)
def unarchive_forecast_run(
    run_id: str,
    ctx: TenantContext = Depends(require_permission("forecasts.configure")),
    db: Session = Depends(get_db),
):
    run = db.query(ForecastRun).filter(
        ForecastRun.id == run_id,
        ForecastRun.tenant_id == ctx.tenant.id,
    ).first()
    if not run:
        raise HTTPException(status_code=404, detail="Forecast run not found")

    if run.status == "archived":
        run.status = "completed"
    if not run.summary:
        run.summary = "Restored run"
    db.commit()
    db.refresh(run)

    results = (
        db.query(ForecastRunResult)
        .filter(ForecastRunResult.run_id == run_id)
        .all()
    )
    return ForecastRunDetail(
        id=run.id,
        name=run.name,
        status=run.status,
        launched_at=run.launched_at.strftime("%Y-%m-%d %H:%M:%S") if run.launched_at else "",
        finished_at=run.finished_at.strftime("%Y-%m-%d %H:%M:%S") if run.finished_at else None,
        duration=run.duration or "—",
        model=run.model,
        accuracy=run.accuracy,
        products_count=run.products_count,
        products=run.products_scope,
        summary=run.summary or "",
        results=[
            ForecastRunResultItem(
                sku=r.product_id,
                name=r.product_name,
                forecast=r.forecast,
                accuracy=r.accuracy,
                status=r.status,
            )
            for r in results
        ],
    )


@router.post("/runs/unarchive", response_model=list[ForecastRunListItem])
def unarchive_forecast_runs(
    body: ForecastRunUnarchiveRequest,
    ctx: TenantContext = Depends(require_permission("forecasts.configure")),
    db: Session = Depends(get_db),
):
    if not body.run_ids:
        return []

    runs = (
        db.query(ForecastRun)
        .filter(ForecastRun.tenant_id == ctx.tenant.id, ForecastRun.id.in_(body.run_ids))
        .all()
    )
    for run in runs:
        if run.status == "archived":
            run.status = "completed"
        if not run.summary:
            run.summary = "Restored run"

    db.commit()

    return [
        ForecastRunListItem(
            id=r.id,
            name=r.name,
            date=_format_datetime(r.launched_at),
            status=r.status,
            products=r.products_count,
            accuracy=r.accuracy,
            duration=r.duration or "—",
            model=r.model,
        )
        for r in runs
    ]
