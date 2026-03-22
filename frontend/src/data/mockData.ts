export const KPI_METRICS = [
  { label: "Forecast Accuracy", value: "96.8%", delta: "+2.1% vs last month", positive: true },
  { label: "Expected Revenue", value: "$2.4M", delta: "+12.4% vs last year", positive: true },
  { label: "Waste Reduction", value: "34%", delta: "Saved $18.2K this month", positive: true },
  { label: "Active Products", value: "1,847", delta: "12 new this week", positive: true },
];

export const FORECAST_MODELS = [
  { name: "Trend Analyzer", accuracy: 91.3, status: "active" as const, icon: "📊", detail: "Finds repeating weekly & seasonal patterns" },
  { name: "Smart Forecast", accuracy: 96.8, status: "winner" as const, icon: "🏆", detail: "Best overall — adapts to weather, events & promos" },
  { name: "Pattern Finder", accuracy: 95.9, status: "active" as const, icon: "🔍", detail: "Detects hidden relationships between products" },
  { name: "Classic Predictor", accuracy: 88.7, status: "active" as const, icon: "📈", detail: "Simple & reliable for stable product lines" },
];

export const CHART_DATA = (() => {
  const data = [];
  const startDate = new Date(2024, 6, 1);
  for (let i = 0; i < 90; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();
    const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.35 : 1;
    const base = 24000 + Math.sin(i / 14) * 4000;
    const noise = (Math.random() - 0.5) * 2000;
    const trend = i * 30;
    let eventBoost = 0;
    if (i >= 72 && i <= 74) eventBoost = 12000;
    if (i >= 60 && i <= 62) eventBoost = 6000;
    const actual = i < 60 ? Math.round((base + noise + trend + eventBoost) * weekendBoost) : undefined;
    const forecast = i >= 55 ? Math.round((base + trend + eventBoost) * weekendBoost) : undefined;
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    data.push({
      date: `${monthNames[date.getMonth()]} ${date.getDate()}`,
      actual,
      forecast,
      upper: forecast ? Math.round(forecast * 1.06) : undefined,
      lower: forecast ? Math.round(forecast * 0.94) : undefined,
    });
  }
  return data;
})();

export const WEATHER_INSIGHTS = [
  { label: "Rain → Canned Goods", value: "+22%", detail: "Sales spike during rainy weeks" },
  { label: "Cold Snap → Soups & Stews", value: "+31%", detail: "Below 40°F triggers demand" },
  { label: "Sunny Weekend → BBQ Items", value: "+18%", detail: "Grills, charcoal, marinades" },
];

export const EVENT_INSIGHTS = [
  { label: "Back to School", date: "Aug 25 – Sep 5", impact: "+28%", detail: "Lunch items, snacks" },
  { label: "Labor Day Weekend", date: "Sep 1-2", impact: "+42%", detail: "Beverages, party supplies" },
  { label: "Local Football Season", date: "Sep – Nov", impact: "+15%", detail: "Chips, dips, frozen pizza" },
];

export const PROMO_INSIGHTS = [
  { label: "Buy 2 Get 1 — Cereals", date: "Jun 12-18", spike: "+210%", note: "Adjusted in forecast" },
  { label: "Summer Beverage Sale", date: "Jul 1-15", spike: "+85%", note: "Adjusted in forecast" },
  { label: "Member Appreciation Week", date: "Aug 5-11", spike: "+65%", note: "Adjusted in forecast" },
];

export const ACTIVITY_LOG = [
  { time: "2 min ago", text: "Forecast updated for Dairy category — 1,204 SKUs", type: "success" as const },
  { time: "18 min ago", text: "Weather alert: Cold front arriving Thu — adjusting frozen food forecast", type: "warning" as const },
  { time: "1 hr ago", text: "New promotion detected: BOGO on soft drinks — normalizing data", type: "info" as const },
  { time: "3 hrs ago", text: "Weekly model retraining complete — accuracy improved +0.3%", type: "success" as const },
  { time: "5 hrs ago", text: "Local event imported: County Fair Sep 20-22 — foot traffic +35%", type: "warning" as const },
  { time: "Yesterday", text: "Monthly report generated for August — sent to team@freshmart.com", type: "info" as const },
];

export const TOP_PRODUCTS = [
  { name: "Whole Milk 1gal", sku: "DAI-001", forecast: "2,340 units", change: "+8%", positive: true },
  { name: "Bananas (bunch)", sku: "PRO-012", forecast: "4,120 units", change: "+3%", positive: true },
  { name: "White Bread", sku: "BAK-003", forecast: "1,890 units", change: "-2%", positive: false },
  { name: "Chicken Breast", sku: "MEA-007", forecast: "1,560 units", change: "+12%", positive: true },
  { name: "Coca-Cola 12pk", sku: "BEV-019", forecast: "980 units", change: "+22%", positive: true },
];

export const CATEGORIES = [
  { name: "Dairy", products: 342, accuracy: 97.1, trend: "up" as const },
  { name: "Produce", products: 287, accuracy: 95.8, trend: "up" as const },
  { name: "Bakery", products: 156, accuracy: 96.2, trend: "stable" as const },
  { name: "Meat & Seafood", products: 198, accuracy: 94.5, trend: "up" as const },
  { name: "Beverages", products: 412, accuracy: 97.4, trend: "up" as const },
  { name: "Frozen", products: 231, accuracy: 96.0, trend: "stable" as const },
  { name: "Snacks", products: 189, accuracy: 95.3, trend: "down" as const },
  { name: "Household", products: 132, accuracy: 98.1, trend: "stable" as const },
];

export const ALL_PRODUCTS = [
  { id: "DAI-001", name: "Whole Milk 1gal", category: "Dairy", price: 4.29, forecast: 2340, lastMonth: 2165, change: 8, accuracy: 97.2, stock: 485, reorderPoint: 200 },
  { id: "DAI-002", name: "2% Milk 1gal", category: "Dairy", price: 4.19, forecast: 1980, lastMonth: 1920, change: 3, accuracy: 96.8, stock: 412, reorderPoint: 180 },
  { id: "DAI-003", name: "Greek Yogurt 32oz", category: "Dairy", price: 5.49, forecast: 1240, lastMonth: 1180, change: 5, accuracy: 95.4, stock: 310, reorderPoint: 120 },
  { id: "DAI-004", name: "Cheddar Cheese Block", category: "Dairy", price: 6.99, forecast: 890, lastMonth: 910, change: -2, accuracy: 97.6, stock: 245, reorderPoint: 100 },
  { id: "DAI-005", name: "Butter 1lb", category: "Dairy", price: 4.99, forecast: 1560, lastMonth: 1420, change: 10, accuracy: 96.1, stock: 380, reorderPoint: 150 },
  { id: "PRO-012", name: "Bananas (bunch)", category: "Produce", price: 0.69, forecast: 4120, lastMonth: 4000, change: 3, accuracy: 95.8, stock: 890, reorderPoint: 400 },
  { id: "PRO-013", name: "Avocados (each)", category: "Produce", price: 1.49, forecast: 2100, lastMonth: 1950, change: 8, accuracy: 93.2, stock: 520, reorderPoint: 200 },
  { id: "PRO-014", name: "Baby Spinach 5oz", category: "Produce", price: 3.99, forecast: 1340, lastMonth: 1280, change: 5, accuracy: 94.7, stock: 290, reorderPoint: 130 },
  { id: "PRO-015", name: "Roma Tomatoes (lb)", category: "Produce", price: 1.99, forecast: 1890, lastMonth: 1820, change: 4, accuracy: 95.1, stock: 410, reorderPoint: 180 },
  { id: "BAK-003", name: "White Bread", category: "Bakery", price: 2.99, forecast: 1890, lastMonth: 1928, change: -2, accuracy: 96.2, stock: 360, reorderPoint: 160 },
  { id: "BAK-004", name: "Whole Wheat Bread", category: "Bakery", price: 3.49, forecast: 1420, lastMonth: 1380, change: 3, accuracy: 96.8, stock: 280, reorderPoint: 130 },
  { id: "BAK-005", name: "Croissants 6pk", category: "Bakery", price: 4.99, forecast: 680, lastMonth: 720, change: -6, accuracy: 94.1, stock: 145, reorderPoint: 60 },
  { id: "MEA-007", name: "Chicken Breast (lb)", category: "Meat & Seafood", price: 5.99, forecast: 1560, lastMonth: 1392, change: 12, accuracy: 94.5, stock: 320, reorderPoint: 150 },
  { id: "MEA-008", name: "Ground Beef 80/20 (lb)", category: "Meat & Seafood", price: 6.49, forecast: 1280, lastMonth: 1200, change: 7, accuracy: 95.2, stock: 260, reorderPoint: 120 },
  { id: "MEA-009", name: "Atlantic Salmon (lb)", category: "Meat & Seafood", price: 11.99, forecast: 620, lastMonth: 580, change: 7, accuracy: 93.8, stock: 130, reorderPoint: 55 },
  { id: "BEV-019", name: "Coca-Cola 12pk", category: "Beverages", price: 7.99, forecast: 980, lastMonth: 803, change: 22, accuracy: 97.4, stock: 510, reorderPoint: 200 },
  { id: "BEV-020", name: "Spring Water 24pk", category: "Beverages", price: 4.99, forecast: 1640, lastMonth: 1580, change: 4, accuracy: 98.1, stock: 720, reorderPoint: 300 },
  { id: "BEV-021", name: "Orange Juice 52oz", category: "Beverages", price: 4.49, forecast: 1120, lastMonth: 1080, change: 4, accuracy: 96.5, stock: 340, reorderPoint: 120 },
  { id: "FRZ-030", name: "Frozen Pizza Pepperoni", category: "Frozen", price: 6.99, forecast: 840, lastMonth: 790, change: 6, accuracy: 96.0, stock: 210, reorderPoint: 80 },
  { id: "FRZ-031", name: "Ice Cream Vanilla 1qt", category: "Frozen", price: 5.49, forecast: 1120, lastMonth: 1350, change: -17, accuracy: 95.2, stock: 280, reorderPoint: 100 },
  { id: "SNK-040", name: "Lay's Classic Chips", category: "Snacks", price: 4.29, forecast: 760, lastMonth: 780, change: -3, accuracy: 95.3, stock: 190, reorderPoint: 70 },
  { id: "SNK-041", name: "Oreo Cookies", category: "Snacks", price: 4.99, forecast: 640, lastMonth: 610, change: 5, accuracy: 96.1, stock: 165, reorderPoint: 65 },
  { id: "HOU-050", name: "Paper Towels 6pk", category: "Household", price: 8.99, forecast: 520, lastMonth: 510, change: 2, accuracy: 98.1, stock: 340, reorderPoint: 120 },
  { id: "HOU-051", name: "Dish Soap 22oz", category: "Household", price: 3.49, forecast: 440, lastMonth: 430, change: 2, accuracy: 97.8, stock: 280, reorderPoint: 100 },
];

export const PROMOTIONS_DATA = [
  { id: 1, name: "Buy 2 Get 1 Free — Cereals", status: "active" as const, startDate: "Sep 10", endDate: "Sep 24", category: "Bakery", impact: "+210%", forecastAdjusted: true, revenue: "$12,400" },
  { id: 2, name: "Summer Beverage Blowout", status: "completed" as const, startDate: "Jul 1", endDate: "Jul 15", category: "Beverages", impact: "+85%", forecastAdjusted: true, revenue: "$28,600" },
  { id: 3, name: "Member Appreciation Week", status: "completed" as const, startDate: "Aug 5", endDate: "Aug 11", category: "All", impact: "+65%", forecastAdjusted: true, revenue: "$45,200" },
  { id: 4, name: "Back to School Lunch Deals", status: "active" as const, startDate: "Aug 25", endDate: "Sep 15", category: "Snacks", impact: "+42%", forecastAdjusted: true, revenue: "$8,900" },
  { id: 5, name: "Fall Soup Season Kickoff", status: "scheduled" as const, startDate: "Oct 1", endDate: "Oct 14", category: "Frozen", impact: "+30% (est.)", forecastAdjusted: false, revenue: "—" },
  { id: 6, name: "Holiday Baking Essentials", status: "scheduled" as const, startDate: "Nov 15", endDate: "Dec 5", category: "Bakery", impact: "+55% (est.)", forecastAdjusted: false, revenue: "—" },
];

export const REPORTS_DATA = [
  { id: 1, name: "Monthly Performance — August 2024", type: "Performance", date: "Sep 1, 2024", status: "delivered" as const, recipients: "team@freshmart.com" },
  { id: 2, name: "Weekly Forecast Accuracy", type: "Accuracy", date: "Sep 8, 2024", status: "delivered" as const, recipients: "maria@freshmart.com" },
  { id: 3, name: "Waste & Overstock Analysis — Q3", type: "Waste", date: "Sep 5, 2024", status: "delivered" as const, recipients: "ops@freshmart.com" },
  { id: 4, name: "Promotion Effectiveness — Summer '24", type: "Promotions", date: "Aug 28, 2024", status: "delivered" as const, recipients: "marketing@freshmart.com" },
  { id: 5, name: "Monthly Performance — September 2024", type: "Performance", date: "Oct 1, 2024", status: "scheduled" as const, recipients: "team@freshmart.com" },
  { id: 6, name: "Category Deep Dive: Beverages", type: "Category", date: "Sep 12, 2024", status: "generating" as const, recipients: "maria@freshmart.com" },
];

export const INTEGRATIONS_DATA = [
  {
    id: "weather",
    name: "Weather & Climate",
    description: "Real-time weather data for your store locations. Automatically adjusts forecasts based on temperature, precipitation, and seasonal patterns.",
    provider: "Visual Crossing",
    status: "connected" as const,
    lastSync: "2 min ago",
    icon: "🌦️",
    dataPoints: "Temperature, precipitation, cloud cover, wind speed",
    impact: "Improved forecast accuracy by 4.2%",
  },
  {
    id: "holidays",
    name: "Local Holidays & Events",
    description: "Public holidays, local festivals, sports events, and community gatherings that drive foot traffic changes.",
    provider: "PredictHQ",
    status: "connected" as const,
    lastSync: "1 hr ago",
    icon: "📅",
    dataPoints: "Holidays, concerts, sports, festivals, school schedules",
    impact: "Prevented 23 overstock incidents this quarter",
  },
  {
    id: "pos",
    name: "Point of Sale",
    description: "Direct connection to your POS system for real-time sales data, transaction history, and promotion tracking.",
    provider: "Square POS",
    status: "connected" as const,
    lastSync: "Live",
    icon: "🏪",
    dataPoints: "Transactions, discounts, returns, basket size",
    impact: "Core data source — 1.2M transactions analyzed",
  },
  {
    id: "promotions",
    name: "Promotions & Discounts",
    description: "Tracks all active, scheduled, and past promotions to separate organic demand from promotional spikes.",
    provider: "Internal Database",
    status: "connected" as const,
    lastSync: "Live",
    icon: "🏷️",
    dataPoints: "Discount type, duration, affected SKUs, lift %",
    impact: "Normalized 47 promotional spikes in forecasts",
  },
  {
    id: "supplier",
    name: "Supplier Lead Times",
    description: "Monitors supplier delivery schedules and lead time variability to optimize reorder timing.",
    provider: "TradeGecko",
    status: "disconnected" as const,
    lastSync: "Never",
    icon: "🚚",
    dataPoints: "Lead times, delivery reliability, order minimums",
    impact: "Not yet connected",
  },
  {
    id: "competitor",
    name: "Competitor Pricing",
    description: "Tracks competitor pricing for key SKUs to understand price-driven demand shifts.",
    provider: "Prisync",
    status: "disconnected" as const,
    lastSync: "Never",
    icon: "📊",
    dataPoints: "Competitor prices, price changes, promotions",
    impact: "Not yet connected",
  },
];
