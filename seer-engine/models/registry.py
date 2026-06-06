from models.statistical import _run_SNaive, _run_Croston, _run_AutoARIMA
from models.prophet import _run_Prophet
from models.tree import _run_XGBoost, _run_LightGBM
from models.deep_learning import _run_TFT

MODEL_REGISTRY = {
    "SNaive": _run_SNaive,
    "Croston": _run_Croston,
    "AutoARIMA": _run_AutoARIMA,
    "Prophet": _run_Prophet,
    "LightGBM": _run_LightGBM,
    "XGBoost": _run_XGBoost,
    "TFT": _run_TFT
}

COMPLEXITY_TIERS = {
    "SNaive": 1,
    "Croston": 2,
    "AutoARIMA": 3,
    "Prophet": 4,
    "LightGBM": 5,
    "XGBoost": 6,
    "TFT": 7 
}

