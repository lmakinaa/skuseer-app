"""
Weather Context Injector.

Weather has a massive psychological impact on consumer buying behavior.
This tool connects to the Open-Meteo API to fetch both historical weather
(to help models understand why past sales happened) and future weather forecasts
(to help models predict what will happen).
""" 
import pandas
import requests
from config import (
    DEFAULT_CTC,
    DEFAULT_LON,
    DEFAULT_LAT,
    METEO_FORECAST,
    METEO_ARCHIVE
)

def _apply_weather_tool(data, local=[DEFAULT_CTC, DEFAULT_LON, DEFAULT_LAT]):
    """
    Fetches daily maximum temperature, wind speed, and precipitation for the given
    longitude and latitude. It automatically merges this data as new columns
    attached to the exact dates in the sales grid.
    """
    weather_frames = []
    for product_id, group in data.groupby('unique_id'):

        start_date = group['ds'].min()
        end_date = group['ds'].max()
        cutoff_date = pandas.Timestamp.now().tz_localize(None) - pandas.Timedelta(days=10)

        if start_date < cutoff_date:
            hist_end = min(end_date, cutoff_date)
            params = {
                'latitude': local[2],
                'longitude': local[1],
                'start_date': start_date.strftime("%Y-%m-%d"),
                'end_date': hist_end.strftime("%Y-%m-%d"),
                'daily': ["temperature_2m_max", "precipitation_sum", "wind_speed_10m_max"],
                'timezone': "GMT"
            }
            response = requests.get(METEO_ARCHIVE, params=params)
            json_response = response.json()
            if getattr(json_response, "error", False):
                raise Exception(getattr(json_response, "reason", "failed meteo api call"))
            
            if "daily" in json_response:
                weather_frames.append(pandas.DataFrame({
                    "ds": pandas.to_datetime(json_response["daily"]["time"]),
                    "temperature": json_response["daily"]["temperature_2m_max"],
                    "precipitation": json_response["daily"]["precipitation_sum"],
                    "wind_speed": json_response["daily"]["wind_speed_10m_max"]
                }))

        if end_date >= cutoff_date:
            cast_start = max(start_date, cutoff_date + pandas.Timedelta(days=1))
            params = {
                'latitude': local[2],
                'longitude': local[1],
                'start_date': cast_start.strftime("%Y-%m-%d"),
                'end_date': end_date.strftime("%Y-%m-%d"),
                'daily': ["temperature_2m_max", "precipitation_sum", "wind_speed_10m_max"],
                'timezone': "GMT"
            }
    
            response = requests.get(METEO_FORECAST, params=params)
            json_response = response.json()
            if getattr(json_response, "error", False):
                raise Exception(getattr(json_response, "reason", "failed meteo api call"))

            if "daily" in json_response:
                weather_frames.append(pandas.DataFrame({
                    "ds": pandas.to_datetime(json_response["daily"]["time"]),
                    "temperature": json_response["daily"]["temperature_2m_max"],
                    "precipitation": json_response["daily"]["precipitation_sum"],
                    "wind_speed": json_response["daily"]["wind_speed_10m_max"]
                }))

    full_weather_df = pandas.concat(weather_frames, ignore_index=True)
    full_weather_df = full_weather_df.drop_duplicates(subset=['ds'])
    data = pandas.merge(data, full_weather_df, on='ds', how='left')
    return data

