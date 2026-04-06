import os
import time
import logging
import datetime
import json
from collections import defaultdict

import httpx
from sqlalchemy.orm import Session

from app.models.sales import SalesRecord
from app.models.product import Product
from app.models.forecast_run import ForecastRun, ForecastRunResult
from app.database import SessionLocal

logger = logging.getLogger("forecast_service")

SEER_ENGINE_URL = os.getenv("SEER_ENGINE_URL", "http://localhost:8001")


def generate_sales_csv_data(
    product_ids: list[str],
    tenant_id: str,
    db: Session,
) -> list[dict]:
    """
    Query sales_records for the given products and return rows
    in the format expected by the seer-engine SalesRow schema.
    """
    records = (
        db.query(SalesRecord)
        .filter(
            SalesRecord.tenant_id == tenant_id,
            SalesRecord.product_id.in_(product_ids),
        )
        .order_by(SalesRecord.product_id, SalesRecord.date)
        .all()
    )

    return [
        {
            "product_id": r.product_id,
            "date": r.date.isoformat(),
            "sales": r.quantity,
        }
        for r in records
    ]


def call_seer_engine(sales_data: list[dict], horizon: int = 15) -> dict:
    """
    POST sales data to the seer-engine /forecast endpoint.
    Returns parsed JSON response. Raises on HTTP or connection errors.
    """
    payload = {
        "sales_data": sales_data,
        "horizon": horizon,
        "tools": [],
        "country_code": "MA",
        "longitude": -6.90,
        "latitude": 32.88,
    }

    response = httpx.post(
        f"{SEER_ENGINE_URL}/forecast",
        json=payload,
        timeout=120.0,
    )
    response.raise_for_status()
    return response.json()


def process_engine_response(
    response: dict,
    products_by_id: dict[str, Product],
) -> list[dict]:
    """
    Aggregate per-product forecast points into a single forecast number
    (sum of daily forecasts) and return rows for ForecastRunResult creation.
    """
    product_totals: dict[str, float] = defaultdict(float)
    product_counts: dict[str, int] = defaultdict(int)

    for point in response.get("forecast_points", []):
        pid = point["product_id"]
        product_totals[pid] += point["forecast"]
        product_counts[pid] += 1

    results = []
    for pid, total in product_totals.items():
        product = products_by_id.get(pid)
        if not product:
            continue

        forecast_value = round(total)
        accuracy = round(product.accuracy, 1) if product.accuracy else 0.0
        results.append({
            "product_id": pid,
            "product_name": product.name,
            "forecast": forecast_value,
            "accuracy": accuracy,
            "status": "good" if accuracy >= 95.0 else "review",
        })

    return results


def execute_forecast_run(
    run_id: str,
    product_ids: list[str],
    tenant_id: str,
    horizon: int = 15,
) -> None:
    """
    Background task: fetch sales data, call seer-engine, store results.
    Opens its own DB session since this runs outside the request lifecycle.
    """
    db = SessionLocal()
    start_time = time.time()

    try:
        run = db.query(ForecastRun).filter(ForecastRun.id == run_id).first()
        if not run:
            logger.error("forecast run %s not found", run_id)
            return

        # 1. Generate sales data from DB
        sales_data = generate_sales_csv_data(product_ids, tenant_id, db)

        if not sales_data:
            raise ValueError(
                "No sales data found for the selected products. "
                "Import sales data before running a forecast."
            )

        # 2. Call seer-engine
        engine_response = call_seer_engine(sales_data, horizon=horizon)

        if engine_response.get("status") != "completed":
            raise RuntimeError(
                engine_response.get("error", "Engine returned non-completed status")
            )

        # 3. Transform and store results
        products = (
            db.query(Product)
            .filter(Product.id.in_(product_ids))
            .all()
        )
        products_by_id = {p.id: p for p in products}
        result_rows = process_engine_response(engine_response, products_by_id)

        for r in result_rows:
            db.add(ForecastRunResult(
                run_id=run.id,
                product_id=r["product_id"],
                product_name=r["product_name"],
                forecast=r["forecast"],
                accuracy=r["accuracy"],
                status=r["status"],
            ))

        run.forecast_points_json = json.dumps(engine_response.get("forecast_points", []))

        elapsed = time.time() - start_time
        run.status = "completed"
        run.accuracy = round(
            sum(r["accuracy"] for r in result_rows) / max(len(result_rows), 1),
            1,
        )
        run.duration = f"{elapsed:.1f}s"
        run.summary = (
            f"Processed {len(result_rows)} SKUs via seer-engine. "
            f"Horizon: {engine_response.get('horizon', horizon)} days."
        )
        run.finished_at = datetime.datetime.utcnow()

        logger.info("forecast run %s completed in %s", run_id, run.duration)

    except Exception as exc:
        elapsed = time.time() - start_time
        run = db.query(ForecastRun).filter(ForecastRun.id == run_id).first()
        if run:
            run.status = "failed"
            run.duration = f"{elapsed:.1f}s"
            run.summary = f"Failed: {exc}"
            run.finished_at = datetime.datetime.utcnow()
        logger.error("forecast run %s failed: %s", run_id, exc)

    finally:
        db.commit()
        db.close()
