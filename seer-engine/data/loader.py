import pandas
from core.logger import logger
from tools.registry import TOOLS_REGISTRY

def _build_forecasting_grid(forecast_points, horizon, tools, local) -> pandas.DataFrame:
    logger.info(f"Loading input date from..")

    #data = pandas.read_csv(csv_file)
    data = pandas.DataFrame(forecast_points)
    required = {'date', 'forecast', 'product_id'}
    if not required.issubset(data.columns):
        raise Exception(f"error: need these columns: {required}")

    data['date'] = pandas.to_datetime(data['date'])
    data = data.rename(columns={'product_id': 'unique_id', 'date': 'ds', 'forecast': 'y'})

    total_rows = len(data)
    unique_skus = data['unique_id'].nunique()
    logger.info(f"Dataset parsed: {total_rows} historical rows across {unique_skus} SKUs.")

    result_grid = []

    for product_id, group in data.groupby('unique_id'):
        last_date = group['ds'].max()
        future_dates = pandas.date_range(
                start=last_date + pandas.Timedelta(days=1),
                periods=horizon,
                freq='D'
            )
        product_future = pandas.DataFrame({
            'unique_id': product_id,
            'ds': future_dates
            })

        result_grid.append(group)
        result_grid.append(product_future)

    data = pandas.concat(result_grid, ignore_index=True)
    for tool_name in tools:
        if tool_name in TOOLS_REGISTRY:
            logger.info(f"Applying contextual tool: {tool_name.upper()}")
            tool_function = TOOLS_REGISTRY[tool_name]
            data = tool_function(data, local)
        else:
            logger.warning(f"Tool '{tool_name}' not found in registry. Skipping.")

    return data
