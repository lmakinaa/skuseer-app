"""
Mathematical Evaluation Metrics.
scoring the accuracy of the algorithms during the backtesting tournament.
"""
import numpy

def calculate_smape(y_true, y_pred):
    """
    Calculates the Symmetric Mean Absolute Percentage Error (SMAPE).

    Args:
        y_true: A Pandas array of actual historical sales.
        y_pred: A Pandas array of predicted sales.

    Returns:
        The average percentage error as a float (lower is better).
    """
    denominator = (numpy.abs(y_true) + numpy.abs(y_pred)) / 2.0
    diff = numpy.abs(y_true - y_pred)    
    smape_array = numpy.where(denominator == 0, 0.0, diff / denominator)
    return numpy.mean(smape_array) * 100
