# *`api reference`*

The engine is wrapped in a FastAPI application, operating primarily through a single POST endpoint.

### schemas (`data/schemas.py`)
All input and output data is strictly validated using Pydantic models.

```
- SalesRow: Represents a single historical record. Requires:
  'product_id' (string),
  'date' (YYYY-MM-DD),
  'sales' (integer, cannot be negative).

- ForecastRequest: The main payload.
  Requires a list of 'SalesRow'.
  Optionally accepts 'horizon' (days to forecast),
  'tools' (list of strings like "weather"),
  and geographic coordinates for the weather API.

- ProductForecastPoint: Represents a single forecasted record output by the engine.
- ForecastResponse: The main return object. Contains the status, metadata, and a list of 'ProductForecastPoint' objects.
```

### endpoints (`main.py`)

### *`GET /health`*
```
Returns a simple 200 OK status.
Used by load balancers and container orchestrators (like Docker/Kubernetes) to verify the engine is alive.
```

### *`POST /forecast`*
```
The primary execution route.
1. Accepts the 'ForecastRequest'.
2. Reformats the Pydantic objects into standard Python dictionaries.
3. Passes the dictionaries to the 'run_forecasting_engine' in the core module.
4. Receives the Pandas DataFrame containing the winning prediction.
5. Reformats the DataFrame back into Pydantic objects and returns the 'ForecastResponse'.
```
