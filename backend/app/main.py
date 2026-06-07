from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    auth,
    dashboard,
    products,
    categories,
    forecasts,
    promotions,
    reports,
    integrations,
    pipeline,
    tenants,
    roles,
    admin,
)

app = FastAPI(title="SKUSeer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:8000", "https://demo.skuseer.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,         prefix="/api/auth",                  tags=["Auth"])
app.include_router(dashboard.router,    prefix="/api/dashboard",             tags=["Dashboard"])
app.include_router(products.router,     prefix="/api/products",              tags=["Products"])
app.include_router(categories.router,   prefix="/api/categories",            tags=["Categories"])
app.include_router(forecasts.router,    prefix="/api/forecasts",             tags=["Forecasts"])
app.include_router(promotions.router,   prefix="/api/promotions",            tags=["Promotions"])
app.include_router(reports.router,      prefix="/api/reports",               tags=["Reports"])
app.include_router(integrations.router, prefix="/api/settings/integrations", tags=["Integrations"])
app.include_router(pipeline.router,     prefix="/api/pipeline",              tags=["Pipeline"])
app.include_router(tenants.router,      prefix="/api/tenants",               tags=["Tenants"])
app.include_router(roles.router,        prefix="/api/roles",                 tags=["Roles"])
app.include_router(admin.router,        prefix="/api/admin",                 tags=["Admin"])


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
