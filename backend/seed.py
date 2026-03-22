"""
Seed the SQLite database with mock data that mirrors frontend/src/data/mockData.ts.
Run from the backend/ directory:  python seed.py
"""
import sys, os, math, datetime

sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, SessionLocal, Base
from app.models import (
    Product, Category, ForecastModel, ChartDataPoint,
    Promotion, Report, Integration, ActivityLog,
)

Base.metadata.create_all(bind=engine)


def clear_tables(db):
    for model in [
        ActivityLog, ChartDataPoint, ForecastModel,
        Promotion, Report, Integration, Category, Product,
    ]:
        db.query(model).delete()
    db.commit()


def seed_products(db):
    rows = [
        dict(id="DAI-001", name="Whole Milk 1gal",           category="Dairy",         price=4.29,  forecast=2340, last_month=2165, change=8,   accuracy=97.2, stock=485, reorder_point=200),
        dict(id="DAI-002", name="2% Milk 1gal",              category="Dairy",         price=4.19,  forecast=1980, last_month=1920, change=3,   accuracy=96.8, stock=412, reorder_point=180),
        dict(id="DAI-003", name="Greek Yogurt 32oz",         category="Dairy",         price=5.49,  forecast=1240, last_month=1180, change=5,   accuracy=95.4, stock=310, reorder_point=120),
        dict(id="DAI-004", name="Cheddar Cheese Block",      category="Dairy",         price=6.99,  forecast=890,  last_month=910,  change=-2,  accuracy=97.6, stock=245, reorder_point=100),
        dict(id="DAI-005", name="Butter 1lb",                category="Dairy",         price=4.99,  forecast=1560, last_month=1420, change=10,  accuracy=96.1, stock=380, reorder_point=150),
        dict(id="PRO-012", name="Bananas (bunch)",           category="Produce",       price=0.69,  forecast=4120, last_month=4000, change=3,   accuracy=95.8, stock=890, reorder_point=400),
        dict(id="PRO-013", name="Avocados (each)",           category="Produce",       price=1.49,  forecast=2100, last_month=1950, change=8,   accuracy=93.2, stock=520, reorder_point=200),
        dict(id="PRO-014", name="Baby Spinach 5oz",          category="Produce",       price=3.99,  forecast=1340, last_month=1280, change=5,   accuracy=94.7, stock=290, reorder_point=130),
        dict(id="PRO-015", name="Roma Tomatoes (lb)",        category="Produce",       price=1.99,  forecast=1890, last_month=1820, change=4,   accuracy=95.1, stock=410, reorder_point=180),
        dict(id="BAK-003", name="White Bread",               category="Bakery",        price=2.99,  forecast=1890, last_month=1928, change=-2,  accuracy=96.2, stock=360, reorder_point=160),
        dict(id="BAK-004", name="Whole Wheat Bread",         category="Bakery",        price=3.49,  forecast=1420, last_month=1380, change=3,   accuracy=96.8, stock=280, reorder_point=130),
        dict(id="BAK-005", name="Croissants 6pk",            category="Bakery",        price=4.99,  forecast=680,  last_month=720,  change=-6,  accuracy=94.1, stock=145, reorder_point=60),
        dict(id="MEA-007", name="Chicken Breast (lb)",       category="Meat & Seafood",price=5.99,  forecast=1560, last_month=1392, change=12,  accuracy=94.5, stock=320, reorder_point=150),
        dict(id="MEA-008", name="Ground Beef 80/20 (lb)",    category="Meat & Seafood",price=6.49,  forecast=1280, last_month=1200, change=7,   accuracy=95.2, stock=260, reorder_point=120),
        dict(id="MEA-009", name="Atlantic Salmon (lb)",      category="Meat & Seafood",price=11.99, forecast=620,  last_month=580,  change=7,   accuracy=93.8, stock=130, reorder_point=55),
        dict(id="BEV-019", name="Coca-Cola 12pk",            category="Beverages",     price=7.99,  forecast=980,  last_month=803,  change=22,  accuracy=97.4, stock=510, reorder_point=200),
        dict(id="BEV-020", name="Spring Water 24pk",         category="Beverages",     price=4.99,  forecast=1640, last_month=1580, change=4,   accuracy=98.1, stock=720, reorder_point=300),
        dict(id="BEV-021", name="Orange Juice 52oz",         category="Beverages",     price=4.49,  forecast=1120, last_month=1080, change=4,   accuracy=96.5, stock=340, reorder_point=120),
        dict(id="FRZ-030", name="Frozen Pizza Pepperoni",    category="Frozen",        price=6.99,  forecast=840,  last_month=790,  change=6,   accuracy=96.0, stock=210, reorder_point=80),
        dict(id="FRZ-031", name="Ice Cream Vanilla 1qt",     category="Frozen",        price=5.49,  forecast=1120, last_month=1350, change=-17, accuracy=95.2, stock=280, reorder_point=100),
        dict(id="SNK-040", name="Lay's Classic Chips",       category="Snacks",        price=4.29,  forecast=760,  last_month=780,  change=-3,  accuracy=95.3, stock=190, reorder_point=70),
        dict(id="SNK-041", name="Oreo Cookies",              category="Snacks",        price=4.99,  forecast=640,  last_month=610,  change=5,   accuracy=96.1, stock=165, reorder_point=65),
        dict(id="HOU-050", name="Paper Towels 6pk",          category="Household",     price=8.99,  forecast=520,  last_month=510,  change=2,   accuracy=98.1, stock=340, reorder_point=120),
        dict(id="HOU-051", name="Dish Soap 22oz",            category="Household",     price=3.49,  forecast=440,  last_month=430,  change=2,   accuracy=97.8, stock=280, reorder_point=100),
    ]
    db.add_all([Product(**r) for r in rows])


def seed_categories(db):
    rows = [
        dict(name="Dairy",         products=342, accuracy=97.1, trend="up"),
        dict(name="Produce",       products=287, accuracy=95.8, trend="up"),
        dict(name="Bakery",        products=156, accuracy=96.2, trend="stable"),
        dict(name="Meat & Seafood",products=198, accuracy=94.5, trend="up"),
        dict(name="Beverages",     products=412, accuracy=97.4, trend="up"),
        dict(name="Frozen",        products=231, accuracy=96.0, trend="stable"),
        dict(name="Snacks",        products=189, accuracy=95.3, trend="down"),
        dict(name="Household",     products=132, accuracy=98.1, trend="stable"),
    ]
    db.add_all([Category(**r) for r in rows])


def seed_forecast_models(db):
    rows = [
        dict(name="ARIMA",    display_name="Trend Analyzer",     accuracy=91.3, status="active", detail="Finds repeating weekly & seasonal patterns"),
        dict(name="Prophet",  display_name="Smart Forecast",     accuracy=96.8, status="winner", detail="Best overall — adapts to weather, events & promos"),
        dict(name="XGBoost",  display_name="Pattern Finder",     accuracy=95.9, status="active", detail="Detects hidden relationships between products"),
        dict(name="LSTM",     display_name="Classic Predictor",  accuracy=88.7, status="active", detail="Simple & reliable for stable product lines"),
    ]
    db.add_all([ForecastModel(**r) for r in rows])


def seed_chart_data(db):
    """Replicates the deterministic part of CHART_DATA from mockData.ts (no random noise)."""
    month_names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    start = datetime.date(2024, 7, 1)
    points = []
    for i in range(90):
        d = start + datetime.timedelta(days=i)
        day_of_week = d.weekday()  # Mon=0, Sun=6
        weekend_boost = 1.35 if day_of_week >= 5 else 1.0
        base = 24000 + math.sin(i / 14) * 4000
        trend = i * 30
        event_boost = 0
        if 72 <= i <= 74:
            event_boost = 12000
        if 60 <= i <= 62:
            event_boost = 6000
        actual = round((base + trend + event_boost) * weekend_boost) if i < 60 else None
        forecast = round((base + trend + event_boost) * weekend_boost) if i >= 55 else None
        upper = round(forecast * 1.06) if forecast else None
        lower = round(forecast * 0.94) if forecast else None
        label = f"{month_names[d.month - 1]} {d.day}"
        points.append(ChartDataPoint(date=label, actual=actual, forecast=forecast, upper=upper, lower=lower))
    db.add_all(points)


def seed_promotions(db):
    rows = [
        dict(name="Buy 2 Get 1 Free — Cereals",    status="active",    start_date="Sep 10", end_date="Sep 24", category="Bakery",     impact="+210%",       forecast_adjusted=True,  revenue="$12,400"),
        dict(name="Summer Beverage Blowout",        status="completed", start_date="Jul 1",  end_date="Jul 15", category="Beverages",  impact="+85%",        forecast_adjusted=True,  revenue="$28,600"),
        dict(name="Member Appreciation Week",       status="completed", start_date="Aug 5",  end_date="Aug 11", category="All",        impact="+65%",        forecast_adjusted=True,  revenue="$45,200"),
        dict(name="Back to School Lunch Deals",     status="active",    start_date="Aug 25", end_date="Sep 15", category="Snacks",     impact="+42%",        forecast_adjusted=True,  revenue="$8,900"),
        dict(name="Fall Soup Season Kickoff",       status="scheduled", start_date="Oct 1",  end_date="Oct 14", category="Frozen",     impact="+30% (est.)", forecast_adjusted=False, revenue="—"),
        dict(name="Holiday Baking Essentials",      status="scheduled", start_date="Nov 15", end_date="Dec 5",  category="Bakery",     impact="+55% (est.)", forecast_adjusted=False, revenue="—"),
    ]
    db.add_all([Promotion(**r) for r in rows])


def seed_reports(db):
    rows = [
        dict(name="Monthly Performance — August 2024",    type="Performance", date="Sep 1, 2024",  status="delivered",  recipients="team@freshmart.com"),
        dict(name="Weekly Forecast Accuracy",              type="Accuracy",    date="Sep 8, 2024",  status="delivered",  recipients="maria@freshmart.com"),
        dict(name="Waste & Overstock Analysis — Q3",       type="Waste",       date="Sep 5, 2024",  status="delivered",  recipients="ops@freshmart.com"),
        dict(name="Promotion Effectiveness — Summer '24",  type="Promotions",  date="Aug 28, 2024", status="delivered",  recipients="marketing@freshmart.com"),
        dict(name="Monthly Performance — September 2024",  type="Performance", date="Oct 1, 2024",  status="scheduled",  recipients="team@freshmart.com"),
        dict(name="Category Deep Dive: Beverages",         type="Category",    date="Sep 12, 2024", status="generating", recipients="maria@freshmart.com"),
    ]
    db.add_all([Report(**r) for r in rows])


def seed_integrations(db):
    rows = [
        dict(id="weather",    name="Weather & Climate",      description="Real-time weather data for your store locations. Automatically adjusts forecasts based on temperature, precipitation, and seasonal patterns.", provider="Visual Crossing",   status="connected",    last_synced_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=2),  data_points="Temperature, precipitation, cloud cover, wind speed",           impact="Improved forecast accuracy by 4.2%"),
        dict(id="holidays",   name="Local Holidays & Events",description="Public holidays, local festivals, sports events, and community gatherings that drive foot traffic changes.",                                  provider="PredictHQ",         status="connected",    last_synced_at=datetime.datetime.utcnow() - datetime.timedelta(hours=1),    data_points="Holidays, concerts, sports, festivals, school schedules",        impact="Prevented 23 overstock incidents this quarter"),
        dict(id="pos",        name="Point of Sale",           description="Direct connection to your POS system for real-time sales data, transaction history, and promotion tracking.",                               provider="Square POS",        status="connected",    last_synced_at=datetime.datetime.utcnow(),                                   data_points="Transactions, discounts, returns, basket size",                  impact="Core data source — 1.2M transactions analyzed"),
        dict(id="promotions", name="Promotions & Discounts",  description="Tracks all active, scheduled, and past promotions to separate organic demand from promotional spikes.",                                     provider="Internal Database", status="connected",    last_synced_at=datetime.datetime.utcnow(),                                   data_points="Discount type, duration, affected SKUs, lift %",                 impact="Normalized 47 promotional spikes in forecasts"),
        dict(id="supplier",   name="Supplier Lead Times",     description="Monitors supplier delivery schedules and lead time variability to optimize reorder timing.",                                                provider="TradeGecko",        status="disconnected", last_synced_at=None,                                                         data_points="Lead times, delivery reliability, order minimums",               impact="Not yet connected"),
        dict(id="competitor", name="Competitor Pricing",      description="Tracks competitor pricing for key SKUs to understand price-driven demand shifts.",                                                          provider="Prisync",           status="disconnected", last_synced_at=None,                                                         data_points="Competitor prices, price changes, promotions",                   impact="Not yet connected"),
    ]
    db.add_all([Integration(**r) for r in rows])


def seed_activity_log(db):
    now = datetime.datetime.utcnow()
    rows = [
        dict(created_at=now - datetime.timedelta(minutes=2),  text="Forecast updated for Dairy category — 1,204 SKUs",                                              type="success"),
        dict(created_at=now - datetime.timedelta(minutes=18), text="Weather alert: Cold front arriving Thu — adjusting frozen food forecast",                        type="warning"),
        dict(created_at=now - datetime.timedelta(hours=1),    text="New promotion detected: BOGO on soft drinks — normalizing data",                                 type="info"),
        dict(created_at=now - datetime.timedelta(hours=3),    text="Weekly model retraining complete — accuracy improved +0.3%",                                     type="success"),
        dict(created_at=now - datetime.timedelta(hours=5),    text="Local event imported: County Fair Sep 20-22 — foot traffic +35%",                               type="warning"),
        dict(created_at=now - datetime.timedelta(days=1),     text="Monthly report generated for August — sent to team@freshmart.com",                               type="info"),
    ]
    db.add_all([ActivityLog(**r) for r in rows])


def main():
    db = SessionLocal()
    try:
        print("Clearing existing data...")
        clear_tables(db)
        print("Seeding products...")
        seed_products(db)
        print("Seeding categories...")
        seed_categories(db)
        print("Seeding forecast models...")
        seed_forecast_models(db)
        print("Seeding chart data (90 days)...")
        seed_chart_data(db)
        print("Seeding promotions...")
        seed_promotions(db)
        print("Seeding reports...")
        seed_reports(db)
        print("Seeding integrations...")
        seed_integrations(db)
        print("Seeding activity log...")
        seed_activity_log(db)
        db.commit()
        print("Done. Database seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
