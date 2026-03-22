"""
Static insight data for v1. In a future version, these will be fetched
from the weather/events/promotions external APIs.
"""
from app.schemas.dashboard import WeatherInsight, EventInsight, PromoInsight

WEATHER_INSIGHTS = [
    WeatherInsight(label="Rain → Canned Goods",       value="+22%", detail="Sales spike during rainy weeks"),
    WeatherInsight(label="Cold Snap → Soups & Stews", value="+31%", detail="Below 40°F triggers demand"),
    WeatherInsight(label="Sunny Weekend → BBQ Items", value="+18%", detail="Grills, charcoal, marinades"),
]

EVENT_INSIGHTS = [
    EventInsight(label="Back to School",      date="Aug 25 – Sep 5", impact="+28%", detail="Lunch items, snacks"),
    EventInsight(label="Labor Day Weekend",   date="Sep 1-2",        impact="+42%", detail="Beverages, party supplies"),
    EventInsight(label="Local Football Season",date="Sep – Nov",     impact="+15%", detail="Chips, dips, frozen pizza"),
]

PROMO_INSIGHTS = [
    PromoInsight(label="Buy 2 Get 1 — Cereals",   date="Jun 12-18", spike="+210%", note="Adjusted in forecast"),
    PromoInsight(label="Summer Beverage Sale",     date="Jul 1-15",  spike="+85%",  note="Adjusted in forecast"),
    PromoInsight(label="Member Appreciation Week", date="Aug 5-11",  spike="+65%",  note="Adjusted in forecast"),
]
