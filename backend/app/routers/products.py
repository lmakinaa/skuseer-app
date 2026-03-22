import math
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Product
from app.schemas.product import (
    ProductListResponse, ProductDetailResponse,
    ProductChartPoint, AIInsight, Product as ProductSchema,
)

router = APIRouter()


@router.get("", response_model=ProductListResponse)
def list_products(
    search: str = Query(default="", description="Search by name or SKU"),
    category: str = Query(default="All", description="Filter by category"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Product)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(like)) | (Product.id.ilike(like))
        )
    if category and category != "All":
        query = query.filter(Product.category == category)

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return ProductListResponse(
        items=[ProductSchema.model_validate(p) for p in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{product_id}", response_model=ProductDetailResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Generate 60-day chart data (30 actual + 30 forecast) from product stats
    daily_avg = product.forecast / 30
    chart_data = []
    for day in range(1, 61):
        variation = 1 + 0.15 * math.sin(day / 5)
        if day <= 30:
            chart_data.append(ProductChartPoint(
                day=f"Day {day}",
                actual=round(daily_avg * variation),
                forecast=None,
            ))
        else:
            chart_data.append(ProductChartPoint(
                day=f"Day {day}",
                actual=None,
                forecast=round(daily_avg * variation),
            ))

    # AI insights derived from product data
    insights: list[AIInsight] = []
    sign = "+" if product.change >= 0 else ""
    insights.append(AIInsight(
        text=f"Forecast {sign}{product.change:.0f}% vs last month — model confidence {product.accuracy}%",
        type="success" if product.change >= 0 else "warning",
    ))
    if product.stock <= product.reorder_point * 1.2:
        days_left = round((product.stock - product.reorder_point) / (product.forecast / 30))
        insights.append(AIInsight(
            text=f"Stock level low — reorder recommended within {max(days_left, 1)} days",
            type="warning",
        ))
    else:
        days_until = round((product.stock - product.reorder_point) / (product.forecast / 30))
        insights.append(AIInsight(
            text=f"Stock sufficient — reorder point reached in ~{days_until} days",
            type="info",
        ))
    revenue = product.forecast * product.price
    insights.append(AIInsight(
        text=f"Projected monthly revenue: ${revenue:,.0f}",
        type="info",
    ))

    return ProductDetailResponse(
        product=ProductSchema.model_validate(product),
        chart_data=chart_data,
        insights=insights,
    )
