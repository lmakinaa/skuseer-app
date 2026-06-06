import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from core.engine import _run_forecasting_engine
from core.logger import logger
from config import DEFAULT_CTC, DEFAULT_LON, DEFAULT_LAT, DEFAULT_HORIZON
from data.schemas import SalesRow, ForecastRequest, ProductForecastPoint, ForecastResponse

app = FastAPI(
    title="Seer Forecasting Engine",
    version="1.0.0",
    description="Enterprise Forecasting System",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://localhost:8080", "http://stock-seer.com"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"name": "seer-engine at ur service"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/forecast", response_model=ForecastResponse)
def run_forecast(body: ForecastRequest):
    product_ids = sorted({r.product_id for r in body.sales_data})

    logger.info(
        "forecast request: products=%d rows=%d horizon=%d tools=%s",
        len(product_ids),
        len(body.sales_data),
        body.horizon,
        body.tools,
    )

    try:
        forecast_points = [
            {
                "product_id": row.product_id,
                "date": row.date,
                "forecast": float(row.sales)
            }
            for row in body.sales_data
        ]

        forecast_dataframe = _run_forecasting_engine(
            forecast_points=forecast_points,
            tools=body.tools,
            local=[body.country_code, body.longitude, body.latitude],
            horizon=body.horizon
        )

        forecast_dataframe = forecast_dataframe.rename(columns={
            'unique_id': 'product_id',
            'ds': 'date',
            'y': 'forecast'
        })

        forecast_dataframe['date'] = forecast_dataframe['date'].astype(str)
        forecast_result = forecast_dataframe.to_dict(orient='records')

        logger.info(
            "forecast completed (real): products=%d points=%d",
            len(product_ids),
            len(forecast_result),
        )

        return ForecastResponse(
            status="completed",
            horizon=body.horizon,
            products_count=len(product_ids),
            forecast_points=forecast_result,
        )

    except Exception as exc:
        logger.error("forecast failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))
