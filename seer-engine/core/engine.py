"""
The Forecasting Engine and Tournament Referee.

This is the brain of the system. Instead of relying on a single
algorithm, it runs a backtesting tournament. It hides the most recent historical
data, asks multiple algorithms to predict that hidden data, scores them, and
then uses the winner to generate the final future forecast.
"""
import sys
import pandas
import numpy
from config import ASCII_ART, DEFAULT_CTC, DEFAULT_LON, DEFAULT_LAT, DEFAULT_HORIZON
from core.logger import logger
from core.heuristics import _prune_registry
from core.evaluation import calculate_smape
from data.loader import _build_forecasting_grid
from models.registry import MODEL_REGISTRY, COMPLEXITY_TIERS

def _run_referee_engine(data, tie_threshold_pct, horizon, local):
    """
    runs a backtesting tournament to find the best model for that specific dataset.

    Tie-Breaking Logic:
    1. Single Winner: If one model clearly wins, it is returned alone.
    2. The GM Ensemble: If two models tie AND both are advanced AI (Tier 4+),
       both are returned to be averaged together.
    3. The Occam's Razor: If there is a tie involving simpler models, the
       engine intentionally defaults to the simpler model to prevent overfitting.

    Args:
        data: The historical sales data injected with external tools.
        tie_threshold_pct: The percentage difference allowed to consider two models tied.
        horizon: The number of days to forecast into the future.

    Returns:
        A list containing the name(s) of the winning model(s).
    """
    logger.info(f"Initializing Tournament Referee (Horizon: {horizon} days)")
    history_df = data[data['y'].notnull()].copy()
    history_df = history_df.sort_values(['unique_id', 'ds']).reset_index(drop=True)

    active_registry = _prune_registry(history_df, MODEL_REGISTRY)

    test_df = history_df.groupby('unique_id').tail(horizon).copy()
    train_df = history_df.drop(test_df.index).copy()
    fake_future = test_df.copy()
    fake_future['y'] = numpy.nan

    tournament_grid = pandas.concat([train_df, fake_future], ignore_index=True)
    tournament_grid = tournament_grid.sort_values(['unique_id', 'ds']).reset_index(drop=True)

    scores = {}
    for model_name, model_func in active_registry.items():
        try:
            logger.info(f"Testing model: {model_name}...")
            predictions = model_func(tournament_grid, horizon, local)
            eval_df = pandas.merge(
                    test_df[['unique_id', 'ds', 'y']],
                    predictions[['unique_id', 'ds', 'y']],
                    on=['unique_id', 'ds'],
                    how='inner',
                    suffixes=('_actual', '_pred')
                )
            error = calculate_smape(eval_df['y_actual'], eval_df['y_pred'])
            scores[model_name] = error
            logger.info(f"Score for {model_name}: {error:.2f}% SMAPE")
        except Exception as e:
            logger.error(f"Model {model_name} crashed: {str(e)}")
            scores[model_name] = 999.0

    best_error = min(scores.values())
    acceptable_threshold = best_error + tie_threshold_pct
    contestant = [m for m, err in scores.items() if err <= acceptable_threshold]

    if len(contestant) == 1:
        logger.info(f"Tournament ended. Wineer: {contestant[0]}")
        return contestant

    contestant_by_score = sorted(contestant, key=lambda x: scores[x])
    top_1 = contestant_by_score[0]
    top_2 = contestant_by_score[1]

    if COMPLEXITY_TIERS[top_1] >= 4 and COMPLEXITY_TIERS[top_2] >= 4:
        logger.info(f"Tournament ended. Multi-model GM approach selected: {top_1} and {top_2}")
        return [top_1, top_2]

    contestant.sort(key=lambda x: COMPLEXITY_TIERS[x])
    champion = contestant[0]
    logger.info(f"Tournament ended. Champion selected by it's complexity tier: {champion}")
    return [champion]

def _execute_final_forecast(champion_names, data, horizon, local):
    """
    Runs the winning model(s) on 100% of the historical data to generate the final forecast.

    If the GM protocol was triggered by the referee,
    it calculates the average of their predictions.
    """
    all_predictions = []
    for name in champion_names:
        func = MODEL_REGISTRY[name]
        pred_df = func(data, horizon, local)
        pred_df = pred_df.rename(columns={'y': f'y_{name}'})
        all_predictions.append(pred_df)

    if len(all_predictions) == 1:
        final_df = all_predictions[0].rename(columns={f'y_{champion_names[0]}': 'y'})
        return final_df

    combined_df = pandas.merge(all_predictions[0], all_predictions[1], on=['unique_id', 'ds'])
    col1 = f'y_{champion_names[0]}'
    col2 = f'y_{champion_names[1]}'
    combined_df['y'] = (combined_df[col1] + combined_df[col2]) / 2.0
    return combined_df[['unique_id', 'ds', 'y']]

def _run_forecasting_engine(
        forecast_points,
        tools,
        local=[DEFAULT_CTC, DEFAULT_LON, DEFAULT_LAT],
        horizon=DEFAULT_HORIZON
    ):
    try:
        print(ASCII_ART)
        logger.info("--- STARTING FORECAST PIPELINE ---")
        payload = _build_forecasting_grid(forecast_points, horizon, tools, local)
        winning_models = _run_referee_engine(payload, 0.5, horizon, local)

        logger.info(f"Starting final production run using: {winning_models}")
        final_result = _execute_final_forecast(winning_models, payload, horizon, local) 
        logger.info(f"--- FORECAST PIPELINE COMPLETE SUCCESSFULLY ---")
        return final_result
    except Exception as e:
        logger.critical(f"Pipeline failed with error: {str(e)}")
        sys.exit(1)
