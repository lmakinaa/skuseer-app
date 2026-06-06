# *`core_logic_and_heuristics`*

### the referee engine (`core/engine.py`)
```
'_run_referee_engine' function runs a backtesting tournament:
1. It reads the requested horizon (e.g., 15 days).
2. It slices off the last 15 days of historical data.
3. It asks each model to predict those 15 days.
4. It compares the prediction against the real hidden data using the SMAPE function.
5. If the dataset is too small to safely slice (less than horizon + 2 days),
   it bypasses the tournament entirely and defaults to the SNaive baseline.
```

### evaluation metric (`core/evaluation.py`)
We use **SMAPE (Symmetric Mean Absolute Percentage Error)**.
Unlike standard percentage error, SMAPE treats over-forecasting and under-forecasting equally. It calculates the absolute difference between the forecast and the actual sales, divided by the average of the forecast and the actual sales. This prevents the score from breaking if a product has zero sales on a given day.

### heuristic pre-filtering (`core/heuristics.py`)
Running every model on every dataset is a waste of server compute. The `prune_registry` function drops models before the tournament starts based on industry-standard rules:
* **Drop TFT:** If the dataset has fewer than 5,000 total rows. Neural networks starve on small data.
* **Drop AutoARIMA:** If there are more than 500 unique products. ARIMA scales poorly and would take hours to process.
* **Drop Prophet:** If a product has less than 60 days of history. Prophet needs at least two months to identify seasonality curves.
* **Drop Tree Models (XGBoost/LightGBM):** If a product has less than 30 days of history. Trees need sufficient historical variation to create mathematical splits.
