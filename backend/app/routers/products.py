import csv
import io
import math
import random
import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import require_permission
from app.auth.context import TenantContext
from app.models import Product, ProductImportJob
from app.schemas.product import (
    ProductListResponse, ProductDetailResponse,
    ProductChartPoint, AIInsight, Product as ProductSchema,
    ProductCreate, ProductUpdate, SalesHistoryPoint,
)
from app.schemas.product_import import ProductImportResponse

router = APIRouter()


@router.get("", response_model=ProductListResponse)
def list_products(
    search: str = Query(default="", description="Search by name or SKU"),
    category: str = Query(default="All", description="Filter by category"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    ctx: TenantContext = Depends(require_permission("products.view")),
    db: Session = Depends(get_db),
):
    query = db.query(Product).filter(Product.tenant_id == ctx.tenant.id)
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


@router.post("", response_model=ProductSchema, status_code=201)
def create_product(
    body: ProductCreate,
    ctx: TenantContext = Depends(require_permission("products.edit")),
    db: Session = Depends(get_db),
):
    existing = db.query(Product).filter(
        Product.id == body.id,
        Product.tenant_id == ctx.tenant.id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Product with SKU '{body.id}' already exists")

    product = Product(
        id=body.id,
        tenant_id=ctx.tenant.id,
        name=body.name,
        category=body.category,
        price=body.price,
        stock=body.stock,
        reorder_point=body.reorder_point,
        forecast=body.forecast,
        last_month=body.last_month,
        change=body.change,
        accuracy=body.accuracy,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return ProductSchema.model_validate(product)


# --- Import / Export (must be before /{product_id} to avoid path collision) ---


@router.get("/import/history", response_model=list[ProductImportResponse])
def import_history(
    ctx: TenantContext = Depends(require_permission("products.import")),
    db: Session = Depends(get_db),
):
    jobs = (
        db.query(ProductImportJob)
        .filter(ProductImportJob.tenant_id == ctx.tenant.id)
        .order_by(ProductImportJob.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        ProductImportResponse(
            id=j.id,
            file=j.filename,
            date=j.created_at.strftime("%b %d, %Y") if j.created_at else "",
            items=j.items_count,
            status=j.status,
        )
        for j in jobs
    ]


@router.post("/import", response_model=ProductImportResponse, status_code=201)
async def import_products(
    file: UploadFile = File(...),
    ctx: TenantContext = Depends(require_permission("products.import")),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted")

    contents = await file.read()
    text = contents.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))

    count = 0
    for row in reader:
        product_id = row.get("id") or row.get("sku")
        name = row.get("name")
        if not product_id or not name:
            continue
        existing = db.query(Product).filter(
            Product.id == product_id, Product.tenant_id == ctx.tenant.id
        ).first()
        if existing:
            for field in ("name", "category", "price", "stock", "reorder_point"):
                if field in row and row[field]:
                    val = row[field]
                    if field == "price":
                        val = float(val)
                    elif field in ("stock", "reorder_point"):
                        val = int(val)
                    setattr(existing, field, val)
        else:
            db.add(Product(
                id=product_id,
                tenant_id=ctx.tenant.id,
                name=name,
                category=row.get("category", "Uncategorized"),
                price=float(row.get("price", 0)),
                stock=int(row.get("stock", 0)),
                reorder_point=int(row.get("reorder_point", 0)),
                forecast=0,
                last_month=0,
                change=0,
                accuracy=0,
            ))
        count += 1

    job = ProductImportJob(
        tenant_id=ctx.tenant.id,
        filename=file.filename,
        items_count=count,
        status="completed",
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    return ProductImportResponse(
        id=job.id,
        file=job.filename,
        date=job.created_at.strftime("%b %d, %Y") if job.created_at else "",
        items=job.items_count,
        status=job.status,
    )


@router.get("/export", response_class=StreamingResponse)
def export_products(
    ctx: TenantContext = Depends(require_permission("products.import")),
    db: Session = Depends(get_db),
):
    products = db.query(Product).filter(Product.tenant_id == ctx.tenant.id).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "name", "category", "price", "forecast", "last_month", "change", "accuracy", "stock", "reorder_point"])
    for p in products:
        writer.writerow([p.id, p.name, p.category, p.price, p.forecast, p.last_month, p.change, p.accuracy, p.stock, p.reorder_point])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=products_catalog.csv"},
    )


# --- Single product routes ---


@router.get("/{product_id}", response_model=ProductDetailResponse)
def get_product(
    product_id: str,
    ctx: TenantContext = Depends(require_permission("products.view")),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.tenant_id == ctx.tenant.id,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

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


@router.get("/{product_id}/sales-history", response_model=list[SalesHistoryPoint])
def get_sales_history(
    product_id: str,
    days: int = Query(default=90, ge=1, le=365),
    ctx: TenantContext = Depends(require_permission("products.view")),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.tenant_id == ctx.tenant.id,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    daily_avg = product.last_month / 30
    rng = random.Random(hash(product_id))  # deterministic per product
    data: list[SalesHistoryPoint] = []
    for i in range(days - 1, -1, -1):
        dt = datetime.date.today() - datetime.timedelta(days=i)
        day_of_week = dt.weekday()
        weekend_boost = 1.35 if day_of_week >= 5 else 1.0
        noise = (rng.random() - 0.5) * daily_avg * 0.4
        trend = ((days - i) / days) * daily_avg * 0.1
        sales = max(0, round((daily_avg + noise + trend) * weekend_boost))
        data.append(SalesHistoryPoint(
            date=f"{dt.month}/{dt.day}",
            sales=sales,
        ))
    return data


@router.patch("/{product_id}", response_model=ProductSchema)
def update_product(
    product_id: str,
    body: ProductUpdate,
    ctx: TenantContext = Depends(require_permission("products.edit")),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.tenant_id == ctx.tenant.id,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return ProductSchema.model_validate(product)


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: str,
    ctx: TenantContext = Depends(require_permission("products.delete")),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.tenant_id == ctx.tenant.id,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
