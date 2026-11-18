# SKUSeer — demand forecasting for retailers

SKUSeer tells a retailer **how much of each product they will sell** over the next weeks,
so they order the right amount. It doesn't trust a single forecasting model. For every
upload it runs a **backtest tournament** between seven algorithms on that store's own
history, enriched with weather and local holidays, and keeps whichever one actually
predicted the most recent weeks best.

```
sales CSV ─► clean & enrich ─► prune unsuitable models ─► backtest tournament ─► winner forecasts the future
             (weather, holidays)   (data-size heuristics)      (SMAPE on held-out days)
```

---

## Why it matters — business impact

Inventory is usually a retailer's largest asset, and both failure modes cost money.
**Stock-outs** lose the sale and the customer. **Over-stock** ties up cash, takes shelf
space and ends in markdowns or waste for perishables. Most small and mid-size retailers
still reorder from a spreadsheet and gut feel. Enterprise forecasting suites are priced
and staffed for chains.

| Problem | What SKUSeer does | Business effect |
|---|---|---|
| One model is right for some SKUs and badly wrong for others | A per-dataset tournament picks the model with the lowest measured error | Forecast quality is measured, not assumed |
| Sales spikes from rain, a cold snap or Eid get read as "trend" | Weather (Open-Meteo) and national holidays (incl. moving dates like Eid) are merged in as features | Fewer phantom surges and fewer over-orders |
| Heavy models get run on data too small for them | Heuristics drop models before training (e.g. TFT under 5k rows, Prophet under 60 days) | Lower compute cost and faster runs |
| Forecasts are a black box | Each run records every model's backtest SMAPE and the winner, and streams logs live | Planners can see *why* to trust a number |
| Retail data lives in many tenants and roles | Multi-tenant workspaces with Keycloak SSO and role-based permissions | Can serve several stores or clients from one deployment |

**Who it's for:** independent grocers, small retail chains, and e-commerce sellers
with a few hundred SKUs, plus the consultants who do their replenishment planning.

---

## What I built

I built the whole product end to end: the forecasting engine, the platform backend, the
dashboard, and the auth and multi-tenant model.

| Component | Path | Stack | Responsibility |
|---|---|---|---|
| **Seer engine** | [`seer-engine/`](seer-engine/) | FastAPI, pandas, statsforecast, Prophet, XGBoost/LightGBM, neuralforecast (TFT) | Enrichment tools, heuristic pruning, backtest tournament, final forecast |
| **Platform API** | [`backend/`](backend/) | FastAPI, SQLAlchemy, Alembic | Tenants, users, roles/permissions, products, sales import, forecast runs, promotions, reports, SSE job streams |
| **Dashboard** | [`frontend/`](frontend/) | React, Vite, TanStack Query, Recharts, Tailwind | Forecasts, product detail, accuracy by category, CSV import, settings |
| **Identity** | [`keycloak/`](keycloak/) | Keycloak 24 | Realm, roles, SSO, branded login theme |

### The tournament

1. **Ingest:** sales rows `(sku, date, qty)` are validated and turned into a daily grid per SKU.
2. **Enrich:** [`tools/weather_tool.py`](seer-engine/tools/weather_tool.py) pulls historical *and* forecast weather. [`tools/holidays_tool.py`](seer-engine/tools/holidays_tool.py) flags national public holidays, including moving dates like Eid.
3. **Prune:** [`core/heuristics.py`](seer-engine/core/heuristics.py) removes models the data cannot support.
4. **Backtest:** the most recent window is hidden. Each surviving model forecasts it and is scored with SMAPE ([`core/evaluation.py`](seer-engine/core/evaluation.py)).
5. **Forecast:** the winner is retrained on all the history and projects the horizon.

Candidates, from simplest to heaviest: Seasonal Naive, Croston (intermittent demand),
AutoARIMA, Prophet, LightGBM, XGBoost and a Temporal Fusion Transformer.

---

## Running it

```bash
docker compose up -d --build
```

| Service | URL |
|---|---|
| Dashboard | http://localhost:8080 |
| Platform API | http://localhost:8000/docs |
| Seer engine | http://localhost:8001/docs |
| Keycloak | http://localhost:8180 |

Sign in with the seeded **local demo** account `demo` / `demo123`. The Keycloak admin
console uses `admin` / `admin`. Both are dev-only defaults baked into
[`docker-compose.yml`](docker-compose.yml) and [`keycloak/stockseer-realm.json`](keycloak/stockseer-realm.json),
so change them before any non-local deployment.

To try it with data, import the sample CSVs in [`backend/mock_data/`](backend/mock_data/)
(Settings → Products → Import), then start a forecast run.

---

## Status and what's left

- ✅ Engine tournament, enrichment tools, platform API, dashboard and SSO all work end to end.
- 🟡 The dashboard's weather/event/promotion *insight cards* are static sample data in v1
  ([`insight_service.py`](backend/app/services/insight_service.py)). The engine already
  uses those signals as features, but the cards don't read from it yet.
- ⬜ Promotions as a model feature (a store's own discount history) is designed but not yet wired in.
- ⬜ POS/Shopify connectors in place of CSV import.
- ⬜ Calibration against real store outcomes (forecast error and stock-out reduction over time).

Design notes: [`architecture.md`](architecture.md) · engine docs: [`seer-engine/docs/`](seer-engine/docs/)
