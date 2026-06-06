"""
Heuristic Model Pre-Filtering.

Running complex algorithms on data that does not fit them wastes resources.
This module looks at the size and shape of the data and disqualifies algorithms
before the tournament even begins based on industry-standard rules.
"""
from core.logger import logger

def _prune_registry(data, registry):
    """
    Rules applied:
    - TFT: Dropped if less than 5000 rows (needs massive data to learn).
    - AutoARIMA: Dropped if more than 500 SKUs (takes too long to run localized searches).
    - Prophet: Dropped if less than 60 days of history (needs time to find seasonal curves).
    - Tree Models: Dropped if less than 30 days of history (needs enough variance to split data).
    """
    logger.info("Analyzing data for heuristic model pre-filtering...")
    total_rows = len(data)
    unique_skus = data['unique_id'].nunique()
    history_length = data.groupby('unique_id').size()
    min_history = history_length.min()

    active_models = registry.copy()
    if total_rows < 5000:
        logger.info("FILTER: Dataset too smal for Deep Learning. Dropping TFT.")
        active_models.pop("TFT", None)
    if unique_skus > 500:
        logger.info("FILTER: Too many SKUs for localized search. Dropping AutoARIMA.")
        active_models.pop("AutoARIMA", None)
    if min_history < 60:
        logger.info("FILTER: History too short for Fourier analysis. Dropping Prophet.")
        active_models.pop("Prophet", None)
    if min_history < 30:
        logger.info("FILTER: History too short for tree splits. Dropping XGBoost and LightGBM.")
        active_models.pop("XGBoost", None)
        active_models.pop("LightGBM", None)

    logger.info(f"Surviving models for tournament: {list(active_models.keys())}")
    return active_models

