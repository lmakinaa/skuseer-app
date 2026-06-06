"""
Prophet Wrapper.

Prophet is an additive regression model developed by the Meta (Facebook) Data Science team.
It treats forecasting as a curve-fitting exercise, identifying yearly trends, weekly
patterns, and holiday spikes.
"""
import pandas
from prophet import Prophet
from config import DEFAULT_CTC 
from core.logger import logger

def _run_Prophet(data, horizon, local=[DEFAULT_CTC]):
    """
    Trains a Prophet model for each individual SKU.
    Automatically detects and takes extra features (like weather) if provided.
    """
    standard_cols = ['unique_id', 'ds', 'y']
    prophet_ignore = ['is_holiday']
    feature_cols = [
        col for col in data.columns
        if col not in standard_cols and col not in prophet_ignore
    ]
    if feature_cols:
        logger.info(f"Prophet adding regressors: {feature_cols}")

    all_forecasts = []
    for product_id, group in data.groupby('unique_id'):
        train_df = group[group['y'].notnull()].copy()
        future_df = group[group['y'].isnull()].copy()
        m = Prophet()
        m.add_country_holidays(country_name=local[0])
        for feature in feature_cols:
            m.add_regressor(feature)
        m.fit(train_df)
        forecast = m.predict(future_df)

        future_only = forecast[['ds', 'yhat']].copy()
        future_only['unique_id'] = product_id
        future_only = future_only.rename(columns={'yhat': 'y'})

        all_forecasts.append(future_only)

    final_forecast_df = pandas.concat(all_forecasts, ignore_index=True)
    return final_forecast_df[['unique_id', 'ds', 'y']]

