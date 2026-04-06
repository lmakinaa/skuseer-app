import csv
import io
import math
import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

from app.database import get_db
from app.auth.dependencies import require_permission
from app.auth.context import TenantContext
from app.models import Product, ProductImportJob
from app.models.sales import SalesRecord
from app.schemas.product import (
    ProductListResponse, ProductDetailResponse,
    ProductChartPoint, AIInsight, Product as ProductSchema,
    ProductCreate, ProductUpdate, SalesHistoryPoint,
    SalesRecordCreate, SalesImportResponse,
)
from app.schemas.product_import import ProductImportResponse

router = APIRouter()


def _normalize_key(value: str) -> str:
    return "".join(ch for ch in value.strip().lower() if ch.isalnum())


def _parse_int(value, default: int = 0) -> int:
    try:
        if value is None:
            return default
        return int(float(str(value).strip()))
    except (TypeError, ValueError):
        return default


def _parse_float(value, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(str(value).strip())
    except (TypeError, ValueError):
        return default


def _parse_csv_rows(contents: bytes) -> list[dict[str, str]]:
    text = contents.decode("utf-8-sig")
    best_rows: list[dict[str, str]] = []
    best_score = -1
    for delimiter in [",", "|", ";", "\t"]:
        reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
        rows = list(reader)
        field_count = len(reader.fieldnames or [])
        if field_count > best_score:
            best_score = field_count
            best_rows = rows
    return best_rows


def _detect_delimiter(text: str) -> str:
    candidates = [",", "|", ";", "\t"]
    best = ","
    best_count = -1
    sample = text.splitlines()[:5]
    for d in candidates:
        count = sum(line.count(d) for line in sample)
        if count > best_count:
            best_count = count
            best = d
    return best


def _iter_sales_csv_rows(contents: bytes) -> list[tuple[str | None, str, str]]:
    """
    Returns rows as (product_id_or_none, date_str, quantity_str)
    Supports header and no-header CSV files.
    """
    text = contents.decode("utf-8-sig")
    delimiter = _detect_delimiter(text)

    # First try header-based parsing
    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    fieldnames = [(_normalize_key(f) if f else "") for f in (reader.fieldnames or [])]
    has_header = any(
        fn in {"date", "day", "quantity", "soldquantity", "sales", "qty", "sku", "productid", "productsku"}
        for fn in fieldnames
    )

    if has_header:
        rows: list[tuple[str | None, str, str]] = []
        for row in reader:
            normalized = {
                _normalize_key(str(k)): (v.strip() if isinstance(v, str) else "")
                for k, v in row.items()
                if k
            }
            pid = normalized.get("productid") or normalized.get("sku") or normalized.get("productsku")
            date_str = normalized.get("date") or normalized.get("day") or ""
            qty_str = normalized.get("quantity") or normalized.get("soldquantity") or normalized.get("sales") or normalized.get("qty") or ""
            if date_str and qty_str:
                rows.append((pid, date_str, qty_str))
        return rows

    # Fallback: no-header rows like: sku|yyyy-mm-dd|12 or yyyy-mm-dd|12
    raw_reader = csv.reader(io.StringIO(text), delimiter=delimiter)
    rows: list[tuple[str | None, str, str]] = []
    for raw in raw_reader:
        cols = [c.strip() for c in raw if c is not None]
        if len(cols) < 2:
            continue

        first = cols[0].lower()
        if first in {"sku", "product_id", "productid", "date"}:
            continue

        if len(cols) >= 3:
            rows.append((cols[0], cols[1], cols[2]))
        else:
            rows.append((None, cols[0], cols[1]))
    return rows


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
    try:
        jobs = (
            db.query(ProductImportJob)
            .filter(ProductImportJob.tenant_id == ctx.tenant.id)
            .order_by(ProductImportJob.created_at.desc())
            .limit(20)
            .all()
        )
    except OperationalError:
        # Backward compatibility for databases that haven't run the migration yet
        return []
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
    rows = _parse_csv_rows(contents)

    count = 0
    for row in rows:
        normalized = {
            _normalize_key(str(key)): (value.strip() if isinstance(value, str) else value)
            for key, value in row.items()
            if key
        }

        product_id = (
            normalized.get("sku")
            or normalized.get("id")
            or normalized.get("productid")
            or normalized.get("productsku")
        )
        name = (
            normalized.get("name")
            or normalized.get("prodname")
            or normalized.get("productname")
        )
        if not product_id or not name:
            continue
        existing = db.query(Product).filter(
            Product.id == product_id, Product.tenant_id == ctx.tenant.id
        ).first()
        if existing:
            existing.name = name
            existing.category = normalized.get("category") or existing.category
            existing.price = _parse_float(normalized.get("price"), existing.price)
            existing.stock = _parse_int(normalized.get("stock"), existing.stock)
            existing.reorder_point = _parse_int(
                normalized.get("reorderpoint") or normalized.get("reorder_point"),
                existing.reorder_point,
            )
            existing.forecast = _parse_int(normalized.get("forecast"), existing.forecast)
            existing.last_month = _parse_int(normalized.get("lastmonth") or normalized.get("last_month"), existing.last_month)
            existing.change = _parse_float(normalized.get("change"), existing.change)
            existing.accuracy = _parse_float(normalized.get("accuracy"), existing.accuracy)
        else:
            db.add(Product(
                id=product_id,
                tenant_id=ctx.tenant.id,
                name=name,
                category=normalized.get("category") or "Uncategorized",
                price=_parse_float(normalized.get("price")),
                stock=_parse_int(normalized.get("stock")),
                reorder_point=_parse_int(normalized.get("reorderpoint") or normalized.get("reorder_point")),
                forecast=_parse_int(normalized.get("forecast")),
                last_month=_parse_int(normalized.get("lastmonth") or normalized.get("last_month")),
                change=_parse_float(normalized.get("change")),
                accuracy=_parse_float(normalized.get("accuracy")),
            ))
        count += 1

    # First commit product rows. Import history logging is best-effort.
    db.commit()

    try:
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
    except OperationalError:
        db.rollback()
        return ProductImportResponse(
            id=0,
            file=file.filename,
            date=datetime.datetime.utcnow().strftime("%b %d, %Y"),
            items=count,
            status="completed",
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


# --- Sales data ---


@router.post("/sales/import", response_model=SalesImportResponse, status_code=201)
async def import_sales(
    file: UploadFile = File(...),
    ctx: TenantContext = Depends(require_permission("products.import")),
    db: Session = Depends(get_db),
):
    """Import daily sales data from CSV. Columns: SKU/date/sold quantity (delimiter auto-detected)."""
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted")

    contents = await file.read()
    rows = _parse_csv_rows(contents)

    imported = 0
    skipped = 0

    for row in rows:
        normalized = {
            _normalize_key(str(key)): (value.strip() if isinstance(value, str) else value)
            for key, value in row.items()
            if key
        }

        product_id = (
            normalized.get("productid")
            or normalized.get("sku")
            or normalized.get("productsku")
        )
        date_str = normalized.get("date") or normalized.get("day")
        quantity_str = (
            normalized.get("quantity")
            or normalized.get("soldquantity")
            or normalized.get("sales")
            or normalized.get("qty")
        )

        if not product_id or not date_str or not quantity_str:
            skipped += 1
            continue

        product = db.query(Product).filter(
            Product.id == product_id,
            Product.tenant_id == ctx.tenant.id,
        ).first()
        if not product:
            skipped += 1
            continue

        try:
            sale_date = datetime.date.fromisoformat(date_str)
            quantity = int(float(quantity_str))
        except (ValueError, TypeError):
            skipped += 1
            continue

        existing = db.query(SalesRecord).filter(
            SalesRecord.tenant_id == ctx.tenant.id,
            SalesRecord.product_id == product_id,
            SalesRecord.date == sale_date,
        ).first()

        if existing:
            existing.quantity = quantity
        else:
            db.add(SalesRecord(
                tenant_id=ctx.tenant.id,
                product_id=product_id,
                date=sale_date,
                quantity=quantity,
            ))
        imported += 1

    db.commit()
    return SalesImportResponse(imported=imported, skipped=skipped)


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
    daily_forecast = product.forecast / 30 if product.forecast else 0
    if product.stock <= product.reorder_point * 1.2:
        if daily_forecast > 0:
            days_left = round((product.stock - product.reorder_point) / daily_forecast)
            insights.append(AIInsight(
                text=f"Stock level low — reorder recommended within {max(days_left, 1)} days",
                type="warning",
            ))
        else:
            insights.append(AIInsight(
                text="Stock level low — no forecast data to estimate reorder timing",
                type="warning",
            ))
    else:
        if daily_forecast > 0:
            days_until = round((product.stock - product.reorder_point) / daily_forecast)
            insights.append(AIInsight(
                text=f"Stock sufficient — reorder point reached in ~{days_until} days",
                type="info",
            ))
        else:
            insights.append(AIInsight(
                text="Stock sufficient — no forecast data to estimate reorder timing",
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

    cutoff = datetime.date.today() - datetime.timedelta(days=days)
    records = (
        db.query(SalesRecord)
        .filter(
            SalesRecord.tenant_id == ctx.tenant.id,
            SalesRecord.product_id == product_id,
            SalesRecord.date >= cutoff,
        )
        .order_by(SalesRecord.date.asc())
        .all()
    )

    return [
        SalesHistoryPoint(
            date=f"{r.date.month}/{r.date.day}",
            sales=r.quantity,
        )
        for r in records
    ]


@router.post("/{product_id}/sales", response_model=SalesHistoryPoint, status_code=201)
def create_sales_record(
    product_id: str,
    body: SalesRecordCreate,
    ctx: TenantContext = Depends(require_permission("products.edit")),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.tenant_id == ctx.tenant.id,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        sale_date = datetime.date.fromisoformat(body.date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    existing = db.query(SalesRecord).filter(
        SalesRecord.tenant_id == ctx.tenant.id,
        SalesRecord.product_id == product_id,
        SalesRecord.date == sale_date,
    ).first()

    if existing:
        existing.quantity = body.quantity
    else:
        db.add(SalesRecord(
            tenant_id=ctx.tenant.id,
            product_id=product_id,
            date=sale_date,
            quantity=body.quantity,
        ))

    db.commit()
    return SalesHistoryPoint(
        date=f"{sale_date.month}/{sale_date.day}",
        sales=body.quantity,
    )


@router.post("/{product_id}/sales/import", response_model=SalesImportResponse, status_code=201)
async def import_sales_for_product(
    product_id: str,
    file: UploadFile = File(...),
    ctx: TenantContext = Depends(require_permission("products.edit")),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted")

    product = db.query(Product).filter(
        Product.id == product_id,
        Product.tenant_id == ctx.tenant.id,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    contents = await file.read()
    parsed_rows = _iter_sales_csv_rows(contents)

    imported = 0
    skipped = 0

    for row_pid, date_str, quantity_str in parsed_rows:
        if row_pid and row_pid != product_id:
            skipped += 1
            continue

        try:
            sale_date = datetime.date.fromisoformat(date_str)
            quantity = int(float(quantity_str))
        except (TypeError, ValueError):
            skipped += 1
            continue

        existing = db.query(SalesRecord).filter(
            SalesRecord.tenant_id == ctx.tenant.id,
            SalesRecord.product_id == product_id,
            SalesRecord.date == sale_date,
        ).first()

        if existing:
            existing.quantity = quantity
        else:
            db.add(SalesRecord(
                tenant_id=ctx.tenant.id,
                product_id=product_id,
                date=sale_date,
                quantity=quantity,
            ))
        imported += 1

    db.commit()
    return SalesImportResponse(imported=imported, skipped=skipped)


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
