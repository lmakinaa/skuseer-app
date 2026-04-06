import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import require_permission
from app.auth.context import TenantContext
from app.models import ChartDataPoint as ChartDataPointModel, ActivityLog as ActivityLogModel, Product, Category, ForecastRun
from app.schemas.dashboard import (
    KPI, ForecastChartResponse, ChartDataPoint,
    InsightsResponse, TopProduct, ActivityLogItem,
    TopBarSearchResult, TopBarContextResponse,
)
from app.services.insight_service import WEATHER_INSIGHTS, EVENT_INSIGHTS, PROMO_INSIGHTS

router = APIRouter()


@router.get("/context", response_model=TopBarContextResponse)
def get_top_bar_context(
    ctx: TenantContext = Depends(require_permission("dashboard.view")),
):
    now = datetime.datetime.utcnow()
    if ctx.tenant.timezone:
        try:
            now = datetime.datetime.now(ZoneInfo(ctx.tenant.timezone))
        except Exception:
            now = datetime.datetime.utcnow()
    month_start = now.replace(day=1)
    if now.month == 12:
        next_month = now.replace(year=now.year + 1, month=1, day=1)
    else:
        next_month = now.replace(month=now.month + 1, day=1)
    month_end = next_month - datetime.timedelta(days=1)
    return TopBarContextResponse(
        date_label=now.strftime("%b %d, %Y"),
        range_label=f"{month_start.strftime('%b')} {month_start.day} – {month_end.strftime('%b')} {month_end.day}, {month_end.year}",
        timezone=ctx.tenant.timezone or "UTC",
    )


@router.get("/search", response_model=list[TopBarSearchResult])
def search_top_bar(
    q: str = Query(..., min_length=1),
    ctx: TenantContext = Depends(require_permission("dashboard.view")),
    db: Session = Depends(get_db),
):
    query = q.strip()
    if not query:
        return []

    pattern = f"%{query}%"
    results: list[TopBarSearchResult] = []

    products = (
        db.query(Product)
        .filter(Product.tenant_id == ctx.tenant.id)
        .filter(or_(Product.id.ilike(pattern), Product.name.ilike(pattern), Product.category.ilike(pattern)))
        .order_by(Product.name.asc())
        .limit(5)
        .all()
    )
    for product in products:
        results.append(TopBarSearchResult(
            id=product.id,
            type="product",
            title=product.name,
            subtitle=f"{product.category} · SKU {product.id}",
            path=f"/products/{product.id}",
        ))

    categories = (
        db.query(Category)
        .filter(Category.tenant_id == ctx.tenant.id)
        .filter(Category.name.ilike(pattern))
        .order_by(Category.name.asc())
        .limit(5)
        .all()
    )
    for category in categories:
        results.append(TopBarSearchResult(
            id=category.id,
            type="category",
            title=category.name,
            subtitle=f"{category.products} products",
            path="/settings",
        ))

    forecast_runs = (
        db.query(ForecastRun)
        .filter(ForecastRun.tenant_id == ctx.tenant.id)
        .filter(or_(ForecastRun.id.ilike(pattern), ForecastRun.name.ilike(pattern), ForecastRun.model.ilike(pattern)))
        .order_by(ForecastRun.launched_at.desc())
        .limit(5)
        .all()
    )
    for run in forecast_runs:
        results.append(TopBarSearchResult(
            id=run.id,
            type="forecast_run",
            title=run.name,
            subtitle=f"{run.model} · {run.status}",
            path=f"/forecasts/{run.id}",
        ))

    return results[:10]


@router.get("/kpis", response_model=list[KPI])
def get_kpis(
    ctx: TenantContext = Depends(require_permission("dashboard.view")),
    db: Session = Depends(get_db),
):
    product_count = db.query(Product).filter(Product.tenant_id == ctx.tenant.id).count()
    return [
        KPI(label="Forecast Accuracy",  value="96.8%",  delta="+2.1% vs last month",      positive=True),
        KPI(label="Expected Revenue",   value="$2.4M",  delta="+12.4% vs last year",       positive=True),
        KPI(label="Waste Reduction",    value="34%",    delta="Saved $18.2K this month",   positive=True),
        KPI(label="Active Products",    value=f"{product_count:,}", delta="12 new this week", positive=True),
    ]


@router.get("/forecast-chart", response_model=ForecastChartResponse)
def get_forecast_chart(
    ctx: TenantContext = Depends(require_permission("dashboard.view")),
    db: Session = Depends(get_db),
):
    points = (
        db.query(ChartDataPointModel)
        .filter(ChartDataPointModel.tenant_id == ctx.tenant.id)
        .order_by(ChartDataPointModel.id)
        .all()
    )
    data = [
        ChartDataPoint(
            date=p.date,
            actual=p.actual,
            forecast=p.forecast,
            upper=p.upper,
            lower=p.lower,
        )
        for p in points
    ]
    return ForecastChartResponse(data=data, today_marker="Aug 25")


@router.get("/activity", response_model=list[ActivityLogItem])
def get_activity(
    ctx: TenantContext = Depends(require_permission("dashboard.view")),
    db: Session = Depends(get_db),
):
    logs = (
        db.query(ActivityLogModel)
        .filter(ActivityLogModel.tenant_id == ctx.tenant.id)
        .order_by(ActivityLogModel.created_at.desc())
        .limit(20)
        .all()
    )
    now = datetime.datetime.utcnow()
    result = []
    for log in logs:
        diff = now - log.created_at
        if diff.total_seconds() < 60:
            time_str = "just now"
        elif diff.total_seconds() < 3600:
            mins = int(diff.total_seconds() / 60)
            time_str = f"{mins} min ago"
        elif diff.total_seconds() < 86400:
            hrs = int(diff.total_seconds() / 3600)
            time_str = f"{hrs} hr ago"
        else:
            time_str = "Yesterday"
        result.append(ActivityLogItem(time=time_str, text=log.text, type=log.type))
    return result


@router.get("/top-products", response_model=list[TopProduct])
def get_top_products(
    ctx: TenantContext = Depends(require_permission("dashboard.view")),
    db: Session = Depends(get_db),
):
    products = (
        db.query(Product)
        .filter(Product.tenant_id == ctx.tenant.id)
        .order_by(Product.forecast.desc())
        .limit(5)
        .all()
    )
    result = []
    for p in products:
        sign = "+" if p.change >= 0 else ""
        result.append(TopProduct(
            name=p.name,
            sku=p.id,
            forecast=f"{p.forecast:,} units",
            change=f"{sign}{p.change:.0f}%",
            positive=p.change >= 0,
        ))
    return result


@router.get("/insights", response_model=InsightsResponse)
def get_insights(
    ctx: TenantContext = Depends(require_permission("dashboard.view")),
):
    return InsightsResponse(
        weather=WEATHER_INSIGHTS,
        events=EVENT_INSIGHTS,
        promos=PROMO_INSIGHTS,
    )
