import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import require_permission
from app.auth.context import TenantContext
from app.models import ChartDataPoint as ChartDataPointModel, ActivityLog as ActivityLogModel, Product
from app.schemas.dashboard import (
    KPI, ForecastChartResponse, ChartDataPoint,
    InsightsResponse, TopProduct, ActivityLogItem,
)
from app.services.insight_service import WEATHER_INSIGHTS, EVENT_INSIGHTS, PROMO_INSIGHTS

router = APIRouter()


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
