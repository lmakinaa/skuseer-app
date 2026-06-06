# *`system architecture`*
```
The Seer Forecasting Engine is an automated time-series forecasting system.
Instead of relying on a single algorithm, it takes historical sales data,
tests multiple algorithms in real-time,
and selects the most accurate one to generate the final prediction.
```

### data flow
```
1. input: The user sends a JSON payload to the FastAPI endpoint ('/forecast').
2. validation: Pydantic validates the input format and data types.
3. data loading: The raw data is converted into a Pandas DataFrame.
4. tool injection: External data (weather history, future forecasts, and local holidays) is merged into the dataset to give the algorithms more context.
5. heuristic filtering: The system analyzes the data size and shape to instantly disqualify algorithms that are inappropriate for the dataset.
6. tournament: The system hides the last few days of historical data, asks the surviving models to predict those hidden days, and scores their accuracy using SMAPE.
7. final forecast: The winning model is trained on 100% of the historical data and projects the final forecast into the future.
8. output: The data is converted back to JSON and returned to the user.
```

### directory structure
* `config.py`: Global variables (API keys, default locations, horizon limits).
* `main.py`: The FastAPI application and route definitions.
* `core/`: The brain of the system (tournament logic, math, logging, filtering).
* `data/`: Data ingestion and formatting.
* `models/`: The actual machine learning algorithms.
* `tools/`: External data fetchers (weather, holidays).
