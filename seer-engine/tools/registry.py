from tools.holidays_tool import _apply_holiday_tool
from tools.weather_tool import _apply_weather_tool

TOOLS_REGISTRY = {
        'holidays': _apply_holiday_tool,
        'weather': _apply_weather_tool
}

