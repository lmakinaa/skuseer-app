"""
Holiday Context Injector.

not all machine learning models know what a calendar is. If a product
sells out on December 25th, the model might incorrectly assume that product will
always sell out on the 25th of every month.

This tool uses the target country code to flag national holidays so the models
can understand that a massive spike in sales was due to a special event, not a
permanent trend.
"""
import holidays
from config import DEFAULT_CTC

def _apply_holiday_tool(data, local=[DEFAULT_CTC]):
    """
    Scans the dataset dates and adds an 'is_holiday' column.
    Places a 1 if the date is a public holiday in the configured country, or a 0 if not.
    """
    country_holidays = holidays.country_holidays(local[0])
    data['is_holiday'] = data['ds'].dt.date.apply(lambda x:1 if x in country_holidays else 0)
    return data

