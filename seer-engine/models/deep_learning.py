"""
Deep Learning / Neural Network Models.

This module contains the Temporal Fusion Transformer (TFT), developed by Google Cloud AI.
It uses the same "Attention" mechanism found in Large Language Models.

Unlike other algorithms that look at one product at a time, TFT looks at the entire
catalog simultaneously to learn shared patterns. It is very heavy and requires
massive amounts of data to function properly.
"""
from neuralforecast import NeuralForecast
from neuralforecast.models import TFT

def _run_TFT(data, horizon, local):
    """
    Trains a Temporal Fusion Transformer model on the entire dataset at once.
    """
    standard_cols = ['unique_id', 'ds', 'y']
    feature_cols = [col for col in data.columns if col not in standard_cols]
    train_df = data[data['y'].notnull()].copy()
    future_df = data[data['y'].isnull()].copy()

    tft_model = TFT(
        h=horizon,
        input_size=28,
        #stat_exog_list=['unique_id'],
        futr_exog_list=feature_cols if feature_cols else None,
        hidden_size=64,
        n_head=4,
        scaler_type='standard',
        #val_size=horizon,
        max_steps=100,
        #early_stop_patience_steps=3,
        #val_check_steps=10,
        random_seed=42,
        enable_model_summary=False
    )

    nf = NeuralForecast(
        models=[tft_model],
        freq='D'
    )

    nf.fit(df=train_df)
    if feature_cols:
        future_features = future_df[['unique_id', 'ds'] + feature_cols]
        forecast = nf.predict(futr_df=future_features)
    else:
        forecast = nf.predict()

    #forecast = forecast.reset_index()
    forecast = forecast.rename(columns={'TFT': 'y'})
    return forecast[['unique_id', 'ds', 'y']]

