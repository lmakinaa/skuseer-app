"""
Seed the SQLite database with mock data.
Run from the backend/ directory:  python seed.py
"""
import json, sys, os, math, datetime, uuid

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import (
    Tenant, Permission, Role, RolePermission,
    Product, Category, Subcategory, ForecastModel, ChartDataPoint,
    Promotion, Report, Integration, ActivityLog,
    ForecastRun, ForecastRunResult,
)
from app.models.user import User
from app.models.tenant_membership import TenantMembership
from app.models.permission import ALL_PERMISSIONS


DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001"
DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000002"


def clear_tables(db):
    for model in [
        ForecastRunResult, ForecastRun,
        TenantMembership,
        RolePermission, Role,
        ActivityLog, ChartDataPoint, ForecastModel,
        Promotion, Report, Integration, Subcategory, Category, Product,
        Permission, User, Tenant,
    ]:
        db.query(model).delete()
    db.commit()


def seed_tenant(db):
    tenant = Tenant(
        id=DEFAULT_TENANT_ID,
        name="FreshMart Supermarket",
        slug="freshmart-247",
        store_id="FM-247",
        location="Austin, TX",
        address="1847 Oak Valley Drive, Austin, TX 78704",
        phone="+1 (512) 555-0198",
        website="freshmart247.com",
        timezone="America/Chicago (CST)",
        operating_hours=json.dumps({
            "Mon – Fri": "6:00 AM – 10:00 PM",
            "Saturday": "7:00 AM – 11:00 PM",
            "Sunday": "8:00 AM – 9:00 PM",
            "Holidays": "9:00 AM – 6:00 PM",
        }),
        is_active=True,
    )
    db.add(tenant)
    db.flush()
    return tenant


def seed_permissions(db):
    perms = {}
    for codename, description in ALL_PERMISSIONS:
        p = Permission(id=str(uuid.uuid4()), codename=codename, description=description)
        db.add(p)
        perms[codename] = p
    db.flush()
    return perms


def seed_roles(db, tenant_id, perms):
    # Store Admin — all permissions
    admin_role = Role(id=str(uuid.uuid4()), tenant_id=tenant_id, name="Store Admin", description="Full access to all store features", is_default=False)
    db.add(admin_role)
    db.flush()
    for p in perms.values():
        db.add(RolePermission(id=str(uuid.uuid4()), role_id=admin_role.id, permission_id=p.id))

    # Store Manager — all except delete and dangerous settings
    manager_role = Role(id=str(uuid.uuid4()), tenant_id=tenant_id, name="Store Manager", description="Can view and edit, but not delete", is_default=True)
    db.add(manager_role)
    db.flush()
    manager_exclude = {"products.delete", "promotions.delete", "settings.roles", "settings.members"}
    for codename, p in perms.items():
        if codename not in manager_exclude:
            db.add(RolePermission(id=str(uuid.uuid4()), role_id=manager_role.id, permission_id=p.id))

    # Viewer — view-only permissions
    viewer_role = Role(id=str(uuid.uuid4()), tenant_id=tenant_id, name="Viewer", description="Read-only access", is_default=False)
    db.add(viewer_role)
    db.flush()
    viewer_perms = {"dashboard.view", "products.view", "forecasts.view", "promotions.view", "reports.view", "settings.store"}
    for codename, p in perms.items():
        if codename in viewer_perms:
            db.add(RolePermission(id=str(uuid.uuid4()), role_id=viewer_role.id, permission_id=p.id))

    return admin_role, manager_role, viewer_role


def seed_default_user(db):
    user = User(
        id=DEFAULT_USER_ID,
        keycloak_sub="seed-placeholder",
        email="demo@stockseer.local",
        full_name="Demo User",
        is_platform_admin=True,
    )
    db.add(user)
    db.flush()
    return user


def seed_membership(db, user_id, tenant_id, admin_role_id):
    membership = TenantMembership(
        id=str(uuid.uuid4()),
        user_id=user_id,
        tenant_id=tenant_id,
        role_id=admin_role_id,
        is_active=True,
    )
    db.add(membership)
    db.flush()


def seed_products(db, tenant_id):
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
    db.add_all([Product(tenant_id=tenant_id, **r) for r in rows])


def seed_categories(db, tenant_id):
    categories_data = [
        ("Dairy",          342, 97.1, "up",      ["Milk", "Cheese", "Yogurt", "Butter", "Cream"]),
        ("Produce",        287, 95.8, "up",      ["Fruits", "Vegetables", "Herbs", "Organic"]),
        ("Bakery",         156, 96.2, "stable",  ["Bread", "Pastries", "Cakes", "Tortillas"]),
        ("Meat & Seafood", 198, 94.5, "up",      ["Beef", "Poultry", "Pork", "Seafood", "Deli"]),
        ("Beverages",      412, 97.4, "up",      ["Soft Drinks", "Water", "Juice", "Coffee & Tea", "Energy Drinks"]),
        ("Frozen",         231, 96.0, "stable",  ["Pizza", "Ice Cream", "Vegetables", "Meals", "Desserts"]),
        ("Snacks",         189, 95.3, "down",    ["Chips", "Cookies", "Crackers", "Nuts", "Candy"]),
        ("Household",      132, 98.1, "stable",  ["Cleaning", "Paper Products", "Laundry", "Kitchen"]),
    ]
    for name, products, accuracy, trend, subcats in categories_data:
        cat_id = str(uuid.uuid4())
        db.add(Category(id=cat_id, tenant_id=tenant_id, name=name, products=products, accuracy=accuracy, trend=trend))
        for sub_name in subcats:
            db.add(Subcategory(id=str(uuid.uuid4()), category_id=cat_id, name=sub_name))


def seed_forecast_models(db, tenant_id):
    rows = [
        dict(name="ARIMA",    display_name="Trend Analyzer",     accuracy=91.3, status="active", detail="Finds repeating weekly & seasonal patterns"),
        dict(name="Prophet",  display_name="Smart Forecast",     accuracy=96.8, status="winner", detail="Best overall — adapts to weather, events & promos"),
        dict(name="XGBoost",  display_name="Pattern Finder",     accuracy=95.9, status="active", detail="Detects hidden relationships between products"),
        dict(name="LSTM",     display_name="Classic Predictor",  accuracy=88.7, status="active", detail="Simple & reliable for stable product lines"),
    ]
    db.add_all([ForecastModel(tenant_id=tenant_id, **r) for r in rows])


def seed_chart_data(db, tenant_id):
    month_names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    start = datetime.date(2024, 7, 1)
    points = []
    for i in range(90):
        d = start + datetime.timedelta(days=i)
        day_of_week = d.weekday()
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
        points.append(ChartDataPoint(tenant_id=tenant_id, date=label, actual=actual, forecast=forecast, upper=upper, lower=lower))
    db.add_all(points)


def seed_promotions(db, tenant_id):
    rows = [
        dict(name="Buy 2 Get 1 Free — Cereals",    status="active",    start_date="Sep 10", end_date="Sep 24", category="Bakery",     impact="+210%",       forecast_adjusted=True,  revenue="$12,400"),
        dict(name="Summer Beverage Blowout",        status="completed", start_date="Jul 1",  end_date="Jul 15", category="Beverages",  impact="+85%",        forecast_adjusted=True,  revenue="$28,600"),
        dict(name="Member Appreciation Week",       status="completed", start_date="Aug 5",  end_date="Aug 11", category="All",        impact="+65%",        forecast_adjusted=True,  revenue="$45,200"),
        dict(name="Back to School Lunch Deals",     status="active",    start_date="Aug 25", end_date="Sep 15", category="Snacks",     impact="+42%",        forecast_adjusted=True,  revenue="$8,900"),
        dict(name="Fall Soup Season Kickoff",       status="scheduled", start_date="Oct 1",  end_date="Oct 14", category="Frozen",     impact="+30% (est.)", forecast_adjusted=False, revenue="—"),
        dict(name="Holiday Baking Essentials",      status="scheduled", start_date="Nov 15", end_date="Dec 5",  category="Bakery",     impact="+55% (est.)", forecast_adjusted=False, revenue="—"),
    ]
    db.add_all([Promotion(tenant_id=tenant_id, **r) for r in rows])


def seed_reports(db, tenant_id):
    rows = [
        dict(name="Monthly Performance — August 2024",    type="Performance", date="Sep 1, 2024",  status="delivered",  recipients="team@freshmart.com"),
        dict(name="Weekly Forecast Accuracy",              type="Accuracy",    date="Sep 8, 2024",  status="delivered",  recipients="maria@freshmart.com"),
        dict(name="Waste & Overstock Analysis — Q3",       type="Waste",       date="Sep 5, 2024",  status="delivered",  recipients="ops@freshmart.com"),
        dict(name="Promotion Effectiveness — Summer '24",  type="Promotions",  date="Aug 28, 2024", status="delivered",  recipients="marketing@freshmart.com"),
        dict(name="Monthly Performance — September 2024",  type="Performance", date="Oct 1, 2024",  status="scheduled",  recipients="team@freshmart.com"),
        dict(name="Category Deep Dive: Beverages",         type="Category",    date="Sep 12, 2024", status="generating", recipients="maria@freshmart.com"),
    ]
    db.add_all([Report(tenant_id=tenant_id, **r) for r in rows])


def seed_integrations(db, tenant_id):
    rows = [
        dict(id="weather",    name="Weather & Climate",      description="Real-time weather data for your store locations.", provider="Visual Crossing",   status="connected",    last_synced_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=2),  data_points="Temperature, precipitation, cloud cover, wind speed",  impact="Improved forecast accuracy by 4.2%", icon="🌦️"),
        dict(id="holidays",   name="Local Holidays & Events",description="Public holidays, local festivals, sports events.", provider="PredictHQ",         status="connected",    last_synced_at=datetime.datetime.utcnow() - datetime.timedelta(hours=1),    data_points="Holidays, concerts, sports, festivals",                impact="Prevented 23 overstock incidents this quarter", icon="📅"),
        dict(id="pos",        name="Point of Sale",           description="Direct connection to your POS system.",            provider="Square POS",        status="connected",    last_synced_at=datetime.datetime.utcnow(),                                   data_points="Transactions, discounts, returns, basket size",        impact="Core data source — 1.2M transactions analyzed", icon="🏪"),
        dict(id="promotions", name="Promotions & Discounts",  description="Tracks all active and past promotions.",           provider="Internal Database", status="connected",    last_synced_at=datetime.datetime.utcnow(),                                   data_points="Discount type, duration, affected SKUs, lift %",       impact="Normalized 47 promotional spikes in forecasts", icon="🏷️"),
        dict(id="supplier",   name="Supplier Lead Times",     description="Monitors supplier delivery schedules.",            provider="TradeGecko",        status="disconnected", last_synced_at=None,                                                         data_points="Lead times, delivery reliability, order minimums",     impact="Not yet connected", icon="🚚"),
        dict(id="competitor", name="Competitor Pricing",      description="Tracks competitor pricing for key SKUs.",          provider="Prisync",           status="disconnected", last_synced_at=None,                                                         data_points="Competitor prices, price changes, promotions",         impact="Not yet connected", icon="📊"),
    ]
    db.add_all([Integration(tenant_id=tenant_id, **r) for r in rows])


def seed_activity_log(db, tenant_id):
    now = datetime.datetime.utcnow()
    rows = [
        dict(created_at=now - datetime.timedelta(minutes=2),  text="Forecast updated for Dairy category — 1,204 SKUs",                          type="success"),
        dict(created_at=now - datetime.timedelta(minutes=18), text="Weather alert: Cold front arriving Thu — adjusting frozen food forecast",    type="warning"),
        dict(created_at=now - datetime.timedelta(hours=1),    text="New promotion detected: BOGO on soft drinks — normalizing data",             type="info"),
        dict(created_at=now - datetime.timedelta(hours=3),    text="Weekly model retraining complete — accuracy improved +0.3%",                 type="success"),
        dict(created_at=now - datetime.timedelta(hours=5),    text="Local event imported: County Fair Sep 20-22 — foot traffic +35%",           type="warning"),
        dict(created_at=now - datetime.timedelta(days=1),     text="Monthly report generated for August — sent to team@freshmart.com",           type="info"),
    ]
    db.add_all([ActivityLog(tenant_id=tenant_id, **r) for r in rows])


def seed_forecast_runs(db, tenant_id):
    runs = [
        dict(
            id="FC-001", name="Full Catalog Forecast", status="completed",
            model="Smart Forecast", products_scope="All Products", products_count=24,
            accuracy=96.8, duration="3m 25s",
            summary="Processed 24 SKUs across 8 categories. Average accuracy 96.8%. 3 products flagged for review.",
            launched_at=datetime.datetime(2024, 9, 10, 9, 15, 22),
            finished_at=datetime.datetime(2024, 9, 10, 9, 18, 47),
        ),
        dict(
            id="FC-002", name="Dairy Category Forecast", status="completed",
            model="Smart Forecast", products_scope="Dairy", products_count=5,
            accuracy=97.1, duration="52s",
            summary="Processed 5 Dairy SKUs. High accuracy across all items. No flags.",
            launched_at=datetime.datetime(2024, 9, 9, 14, 30, 10),
            finished_at=datetime.datetime(2024, 9, 9, 14, 31, 2),
        ),
        dict(
            id="FC-003", name="Selected Products Forecast", status="running",
            model="Smart Forecast", products_scope="Custom Selection", products_count=3,
            accuracy=None, duration="In progress",
            summary="Running forecast for 3 selected products...",
            launched_at=datetime.datetime(2024, 9, 10, 10, 5, 33),
            finished_at=None,
        ),
        dict(
            id="FC-004", name="Produce Category Forecast", status="completed",
            model="Trend Analyzer", products_scope="Produce", products_count=4,
            accuracy=95.2, duration="1m 12s",
            summary="Processed 4 Produce SKUs. All within acceptable accuracy range.",
            launched_at=datetime.datetime(2024, 9, 8, 8, 0, 0),
            finished_at=datetime.datetime(2024, 9, 8, 8, 1, 12),
        ),
        dict(
            id="FC-005", name="Full Catalog Forecast", status="completed",
            model="Smart Forecast", products_scope="All Products", products_count=24,
            accuracy=96.1, duration="3m 48s",
            summary="Processed 24 SKUs across 8 categories. Average accuracy 96.1%.",
            launched_at=datetime.datetime(2024, 9, 3, 9, 0, 0),
            finished_at=datetime.datetime(2024, 9, 3, 9, 3, 48),
        ),
        dict(
            id="FC-006", name="Beverages Only", status="completed",
            model="Smart Forecast", products_scope="Beverages", products_count=3,
            accuracy=97.4, duration="31s",
            summary="Processed 3 Beverage SKUs. All high accuracy.",
            launched_at=datetime.datetime(2024, 9, 2, 11, 20, 0),
            finished_at=datetime.datetime(2024, 9, 2, 11, 20, 31),
        ),
    ]
    db.add_all([ForecastRun(tenant_id=tenant_id, **r) for r in runs])
    db.flush()

    # Results for FC-001 (full catalog — top products + flagged ones)
    fc001_results = [
        dict(run_id="FC-001", product_id="DAI-001", product_name="Whole Milk 1gal",          forecast=2340, accuracy=97.2, status="good"),
        dict(run_id="FC-001", product_id="PRO-012", product_name="Bananas (bunch)",           forecast=4120, accuracy=95.8, status="good"),
        dict(run_id="FC-001", product_id="FRZ-031", product_name="Ice Cream Vanilla 1qt",     forecast=1120, accuracy=95.2, status="review"),
        dict(run_id="FC-001", product_id="BAK-005", product_name="Croissants 6pk",            forecast=680,  accuracy=94.1, status="review"),
        dict(run_id="FC-001", product_id="MEA-009", product_name="Atlantic Salmon (lb)",      forecast=620,  accuracy=93.8, status="review"),
    ]

    # Results for FC-002 (dairy only)
    fc002_results = [
        dict(run_id="FC-002", product_id="DAI-001", product_name="Whole Milk 1gal",          forecast=2340, accuracy=97.2, status="good"),
        dict(run_id="FC-002", product_id="DAI-002", product_name="2% Milk 1gal",             forecast=1980, accuracy=96.8, status="good"),
        dict(run_id="FC-002", product_id="DAI-003", product_name="Greek Yogurt 32oz",        forecast=1240, accuracy=95.4, status="good"),
        dict(run_id="FC-002", product_id="DAI-004", product_name="Cheddar Cheese Block",     forecast=890,  accuracy=97.6, status="good"),
        dict(run_id="FC-002", product_id="DAI-005", product_name="Butter 1lb",               forecast=1560, accuracy=96.1, status="good"),
    ]

    # FC-003 has no results (running)

    # Results for FC-004 (produce)
    fc004_results = [
        dict(run_id="FC-004", product_id="PRO-012", product_name="Bananas (bunch)",           forecast=4120, accuracy=95.8, status="good"),
        dict(run_id="FC-004", product_id="PRO-013", product_name="Avocados (each)",           forecast=2100, accuracy=93.2, status="review"),
        dict(run_id="FC-004", product_id="PRO-014", product_name="Baby Spinach 5oz",          forecast=1340, accuracy=94.7, status="good"),
        dict(run_id="FC-004", product_id="PRO-015", product_name="Roma Tomatoes (lb)",        forecast=1890, accuracy=95.1, status="good"),
    ]

    # Results for FC-006 (beverages)
    fc006_results = [
        dict(run_id="FC-006", product_id="BEV-019", product_name="Coca-Cola 12pk",            forecast=980,  accuracy=97.4, status="good"),
        dict(run_id="FC-006", product_id="BEV-020", product_name="Spring Water 24pk",         forecast=1640, accuracy=98.1, status="good"),
        dict(run_id="FC-006", product_id="BEV-021", product_name="Orange Juice 52oz",         forecast=1120, accuracy=96.5, status="good"),
    ]

    all_results = fc001_results + fc002_results + fc004_results + fc006_results
    db.add_all([ForecastRunResult(**r) for r in all_results])


def main():
    db = SessionLocal()
    try:
        print("Clearing existing data...")
        clear_tables(db)

        print("Seeding default tenant...")
        tenant = seed_tenant(db)

        print("Seeding permissions...")
        perms = seed_permissions(db)

        print("Seeding default roles...")
        admin_role, _, _ = seed_roles(db, tenant.id, perms)

        print("Seeding default user...")
        user = seed_default_user(db)

        print("Seeding membership...")
        seed_membership(db, user.id, tenant.id, admin_role.id)

        print("Seeding products...")
        seed_products(db, tenant.id)
        print("Seeding categories...")
        seed_categories(db, tenant.id)
        print("Seeding forecast models...")
        seed_forecast_models(db, tenant.id)
        print("Seeding chart data (90 days)...")
        seed_chart_data(db, tenant.id)
        print("Seeding promotions...")
        seed_promotions(db, tenant.id)
        print("Seeding reports...")
        seed_reports(db, tenant.id)
        print("Seeding integrations...")
        seed_integrations(db, tenant.id)
        print("Seeding activity log...")
        seed_activity_log(db, tenant.id)
        print("Seeding forecast runs...")
        seed_forecast_runs(db, tenant.id)

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
