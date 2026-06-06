"""
Tree-Based Machine Learning Models.

wrappers for LightGBM (created by Microsoft) and XGBoost
(created at the University of Washington). Both are Gradient Boosting frameworks.
They work by building hundreds of simple decision trees, where each new tree
specifically tries to correct the errors made by the previous trees.

They are incredibly fast and excel at utilizing external data features like
temperature and precipitation.
"""
from mlforecast import MLForecast
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor
from window_ops.rolling import rolling_mean, rolling_std
from core.logger import logger

def _run_XGBoost(data, horizon, local):
    """
    Trains an Extreme Gradient Boosting (XGBoost) model.
    Uses rolling averages and standard deviations to help the trees understand recent trends.
    """
    standard_cols = ['unique_id', 'ds', 'y']
    feature_cols = [col for col in data.columns if col not in standard_cols]
    if feature_cols:
        logger.info(f"XGBoost adding features: {feature_cols}")

    train_df = data[data['y'].notnull()].copy()
    future_df = data[data['y'].isnull()].copy()
    
    mlf = MLForecast(
        models=[XGBRegressor(n_jobs=-1, random_state=42)],
        freq='D',
        lags=[1, 7, 14, 28],
        lag_transforms={
            1: [(rolling_mean, 7), (rolling_mean, 28), (rolling_std, 7)]
        }
    )

    mlf.fit(train_df, static_features=[])
    if feature_cols:
        future_features = future_df[['unique_id', 'ds'] + feature_cols]
        forecast = mlf.predict(h=horizon, X_df=future_features)
    else:
        forecast = mlf.predict(h=horizon)

    forecast = forecast.rename(columns={'XGBRegressor': 'y'})
    return forecast[['unique_id', 'ds', 'y']]

def _run_LightGBM(data, horizon, local):
    """
    Trains a LightGBM model using a 'Tweedie' objective.
    The Tweedie distribution is specifically optimized for count-based data (like inventory sales)
    that cannot drop below zero.
    """
    standard_cols = ['unique_id', 'ds', 'y']
    feature_cols = [col for col in data.columns if col not in standard_cols]
    train_df = data[data['y'].notnull()].copy()
    future_df = data[data['y'].isnull()].copy()

    mlf = MLForecast(
        models=[LGBMRegressor(objective='tweedie', n_jobs=-1, random_state=42, verbose=-1)],
        freq='D',
        lags=[1, 7, 14, 28],
        lag_transforms={
            1: [(rolling_mean, 7), (rolling_mean, 28), (rolling_std, 7)]
        }
    )

    mlf.fit(train_df, static_features=[])
    if feature_cols:
        future_features = future_df[['unique_id', 'ds'] + feature_cols]
        forecast = mlf.predict(h=horizon, X_df=future_features)
    else:
        forecast = mlf.predict(h=horizon)

    forecast = forecast.rename(columns={'LGBMRegressor': 'y'})
    return forecast[['unique_id', 'ds', 'y']]

