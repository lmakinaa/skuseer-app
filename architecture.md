# SKUSeer — design notes

Early design notes for the forecasting engine. The implemented version is described in the [README](README.md) and [`seer-engine/docs/`](seer-engine/docs/).

### 1. The Forecasting Models (The Algorithms)
The system uses four different mathematical approaches to evaluate the data:
* **ARIMA (The Historian):** Traditional statistical math. Looks strictly at past numbers to find simple, stable trends. Best for flat, boring data.
* **Prophet (The Calendar Expert):** Built by Meta. Looks for repeating seasonal cycles. Best for tracking weekly slumps or annual holiday rushes.
* **XGBoost (The Condition Checker):** A decision-tree machine learning model. Plays "20 Questions" with the data. Best for tracking sudden shocks like weather changes or price drops.
* **LSTM (The Deep Learner):** A complex neural network with an internal memory. Best for finding deeply hidden, non-linear chain reactions. Heavy and slow.

### 2. The Main Agent Flow (The Brain)
The AI agent manages the models through a strict pipeline:
* **Ingestion:** Reads the uploaded CSV and automatically fetches external API data (weather, economic indicators, local holidays).
* **Feature Engineering:** Converts raw text data (like "Rainy" or "Monday") into numbers the models can read.
* **A/B Testing:** Hides the most recent 30 days of data and asks all four models to predict it. 
* **Scoring:** Compares the models' guesses against the actual hidden data and calculates the error rate for each.
* **Execution:** Selects the model with the lowest error rate, fires the rest, and uses the winner to generate the final future forecast.

### 3. The Backend (Python & FastAPI)
The heavy-lifting engine that runs the math.
* Built with Python using FastAPI for quick endpoint creation.
* Uses Pandas for data manipulation.
* Uses Scikit-learn, Prophet, and XGBoost libraries to run the actual algorithms.
* Handles the A/B testing logic and streams the terminal logs back to the frontend.

### 4. Step-by-Step Build Plan (For the Demo)
* **Step 1: Get Data:** Download a highly seasonal Kaggle dataset (e.g., Umbrella Sales) that includes weather columns.
* **Step 2: Build the API:** Create a Python/FastAPI endpoint that accepts a CSV, trains Prophet and XGBoost, compares their error rates, and returns the winner.
* **Step 3: Build the UI:** React dashboard for uploads, forecasts and model scores.
* **Step 4: Dockerize:** Wrap the frontend and backend in Dockerfiles and tie them together with a `docker-compose.yml` file for instant, enterprise-grade deployment.


---

## Retail context tools

Different sectors are driven by different external factors; v1 targets retail. Three context tools make the forecast aware of *why* past sales moved:

### 1. The Weather & Climate Tool

**The Factor:** Weather is the single biggest driver of daily retail fluctuations. It dictates whether people leave their houses and exactly what they buy when they do.
**The Tool:** `get_weather_data(location, dates)`

* **How to build it:** Use a free REST API like OpenWeatherMap or Visual Crossing.
* **What it does:** The agent passes the store's zip code and the historical dates. The API returns the temperature, precipitation (rain/snow), and cloud cover.
* **Why the agent needs it:** If a store sold 500 winter coats in one week last October, the AI needs this tool to check if it was an unusually freezing week. If it was, the agent knows not to forecast 500 coats for *this* October unless another freeze is coming.

### 2. The Local Holiday & Events Tool

**The Factor:** A baseline machine learning model trained on global data often assumes late December is the biggest shopping spike of the year. But local realities are completely different. For example, if you deploy this for a store in Morocco, the AI needs to know the exact shifting dates of Ramadan or Eid al-Fitr, as those will dictate the massive spikes in food and clothing sales, not Western holidays.
**The Tool:** `get_calendar_events(country_code, region, year)`

* **How to build it:** Use an API like Nager.Date (for public holidays) or PredictHQ (for local concerts, sports games, and festivals).
* **What it does:** Returns a binary `1` or `0` for whether a specific day was a holiday or had a major local event that drove massive foot traffic past the store.
* **Why the agent needs it:** It prevents the Prophet algorithm from getting confused by sudden, massive spikes in historical sales that were just caused by a one-off local parade.

### 3. The Internal Promotions Tool

**The Factor:** You cannot predict organic demand if you don't know when the store was artificially boosting sales with discounts.
**The Tool:** `get_store_promotions(sku_id, dates)`

* **How to build it:** This isn't an external API. This is a simple SQL query tool that connects directly to the store's own database (like their Shopify or POS system).
* **What it does:** The agent asks the database: *"Was this item on sale during these dates?"*
* **Why the agent needs it:** If the store ran a "Buy One Get One Free" sale on shoes last June, sales naturally skyrocketed. If the AI doesn't know about the discount, it will falsely predict another massive shoe surge this June and tell the owner to over-order.

### The Developer Workflow

By giving the agent access to these three tools, you turn a basic math algorithm into an intelligent retail assistant. The agent can look at a CSV, grab the weather, grab the local holidays, check the store's discount history, merge it all together, and *then* run the XGBoost model to find the actual patterns.
