# *`forecasting algorithms reference`*

The engine uses a dynamic registry of algorithms ranging from traditional statistics to advanced neural networks. They are ranked by complexity tiers. In the event of a tie during the tournament, the system defaults to the simpler model to prevent overfitting.

### Seasonal Naive (SNaive)
* **Origin:** Traditional Statistics.
* **Algorithm Type:** Baseline Rule.
* **How it works:** It assumes that history simply repeats itself. If the season length is 7 days, it predicts that next Tuesday will have the exact same sales as last Tuesday. 
* **Purpose in Seer:** This is our baseline. If complex AI models cannot beat SNaive, it means the data has no recognizable patterns, or the external tools (weather/holidays) are not helping.

### Croston's Method
* **Origin:** Traditional Statistics (John Croston, 1972).
* **Algorithm Type:** Intermittent Demand Forecasting.
* **How it works:** Standard averages fail when a product doesn't sell every day (e.g., selling 0 items for five days, then 10 items on Saturday). Croston splits the math into two separate predictions: how many days will pass before the next sale, and how big the sale will be when it finally happens.
* **Purpose in Seer:** It is the dedicated algorithm for slow-moving inventory and highly intermittent spare parts where traditional models would falsely predict fractional sales (like 0.5 items) every day.

### AutoARIMA
* **Origin:** Traditional Statistics (Box-Jenkins method).
* **Algorithm Type:** AutoRegressive Integrated Moving Average.
* **How it works:** It looks at past values to predict future values (AutoRegression) and looks at past forecast errors to adjust future forecasts (Moving Average). The "Auto" means it runs a localized search to find the perfect mathematical parameters for each individual product.
* **Purpose in Seer:** Excellent for short-to-medium datasets where patterns are stable but do not require complex external features.

### Prophet
* **Origin:** Meta (Facebook) Core Data Science Team.
* **Algorithm Type:** Additive Regression.
* **How it works:** Instead of looking step-by-step like ARIMA, Prophet treats forecasting as a curve-fitting exercise. It breaks data down into three curves: overall growth trend, yearly seasonality, and weekly seasonality. 
* **Purpose in Seer:** Prophet is highly robust against missing data and extreme outliers. It natively understands holidays and is the best model for human-scale behaviors (like weekend shopping spikes).

### LightGBM (Light Gradient Boosting Machine)
* **Origin:** Microsoft.
* **Algorithm Type:** Tree-based Machine Learning.
* **How it works:** It builds hundreds of simple "decision trees." Each new tree is built specifically to correct the mathematical mistakes made by the previous trees (Gradient Boosting). LightGBM grows its trees "leaf-wise," meaning it focuses only on the most complex data points rather than building symmetrical trees.
* **Purpose in Seer:** It is incredibly fast and uses a "Tweedie" objective, which is specifically designed for count-based data like inventory and sales. It excels when provided with external features like weather.

### XGBoost (Extreme Gradient Boosting)
* **Origin:** University of Washington (Tianqi Chen).
* **Algorithm Type:** Tree-based Machine Learning.
* **How it works:** Similar to LightGBM, but it builds trees "level-wise" (symmetrically) and uses heavier mathematical penalties to prevent the model from memorizing the historical data (overfitting).
* **Purpose in Seer:** It often trades a slightly longer training time for higher accuracy and stability compared to LightGBM.

### TFT (Temporal Fusion Transformer)
* **Origin:** Google Cloud AI Research.
* **Algorithm Type:** Deep Learning / Neural Network.
* **How it works:** It uses the same "Attention" mechanism found in Large Language Models. Instead of forecasting one product at a time, it looks at the entire catalog simultaneously to learn shared patterns across all products.
* **Purpose in Seer:** This is the heavy artillery. It is only triggered for massive datasets (5,000+ rows). It is uniquely capable of understanding how static factors (like a product's brand or category) interact with dynamic factors (like daily weather).
