"""
Traditional Statistical Models.

These are classic mathematical approaches to forecasting. They are fast, reliable, 
and serve as excellent baselines to ensure the complex AI models are actually 
learning something useful.
"""
from statsforecast import StatsForecast
from statsforecast.models import AutoARIMA, CrostonClassic, SeasonalNaive

def _run_AutoARIMA(data, horizon, local):
    """
    AutoRegressive Integrated Moving Average.

    It looks at past values and past forecast errors to adjust future forecasts.
    It runs a localized search to find the perfect math parameters for each product.
    """
    clean_history = data[['unique_id', 'ds', 'y']].copy()
    clean_history = clean_history[clean_history['y'].notnull()]

    sf = StatsForecast(
        models=[AutoARIMA(season_length=7)],
        freq='D',
        n_jobs=-1
    )

    sf.fit(df=clean_history)
    forecast_df = sf.predict(h=horizon)
    forecast_df = forecast_df.reset_index()
    forecast = forecast_df.rename(columns={'AutoARIMA': 'y'})
    return forecast[['unique_id', 'ds', 'y']]

def _run_Croston(data, horizon, local):
    """
    Croston's Method.

    Developed by John Croston in 1972, this algorithm is specifically designed for
    "intermittent" demand—products that do not sell every day. Instead of looking
    at a flat average (which would predict 0.5 sales a day), it calculates two
    separate things: how many days pass between a sale, and how big the sale is
    when it finally happens.
    """
    train_df = data[data['y'].notnull()].copy()
    future_df = data[data['y'].isnull()].copy()

    clean_history = train_df[['unique_id', 'ds', 'y']]
    sf = StatsForecast(
        models=[CrostonClassic()],
        freq='D',
        n_jobs=-1
    )
    sf.fit(df=clean_history)
    forecast = sf.predict(h=horizon)

    forecast = forecast.rename(columns={'CrostonClassic': 'y'})
    return forecast[['unique_id', 'ds', 'y']]

def _run_SNaive(data, horizon, local):
    """
    Seasonal Naive.

    The most basic rule: it assumes history simply repeats itself. If the season
    length is 7, it predicts next Tuesday will match last Tuesday.
    If advanced models cannot beat SNaive, it means the data lacks complex patterns.
    """
    train_df = data[data['y'].notnull()].copy()
    future_df = data[data['y'].isnull()].copy()
    clean_history = train_df[['unique_id', 'ds', 'y']]

    sf = StatsForecast(
        models=[SeasonalNaive(season_length=7)],
        freq='D',
        n_jobs=-1
    )

    sf.fit(df=clean_history)
    forecast = sf.predict(h=horizon)
    forecast = forecast.rename(columns={'SeasonalNaive': 'y'})
    return forecast[['unique_id', 'ds', 'y']]

