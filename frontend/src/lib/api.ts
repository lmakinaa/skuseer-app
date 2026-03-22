const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ── camelCase transform ───────────────────────────────────────────────────────
// Converts snake_case keys from the API into camelCase so components stay clean.
function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function camelizeKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(camelizeKeys);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [toCamel(k), camelizeKeys(v)])
    );
  }
  return obj;
}

// ── base fetch ────────────────────────────────────────────────────────────────
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  const json = await res.json();
  return camelizeKeys(json) as T;
}

// ── types matching API responses (post-camelization) ─────────────────────────
export interface KPI {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
}

export interface ChartDataPoint {
  date: string;
  actual?: number;
  forecast?: number;
  upper?: number;
  lower?: number;
}

export interface ForecastChartResponse {
  data: ChartDataPoint[];
  todayMarker: string;
}

export interface WeatherInsight { label: string; value: string; detail: string; }
export interface EventInsight { label: string; date: string; impact: string; detail: string; }
export interface PromoInsight { label: string; date: string; spike: string; note: string; }
export interface InsightsResponse {
  weather: WeatherInsight[];
  events: EventInsight[];
  promos: PromoInsight[];
}

export interface TopProduct {
  name: string;
  sku: string;
  forecast: string;
  change: string;
  positive: boolean;
}

export interface ActivityLogItem {
  time: string;
  text: string;
  type: "success" | "warning" | "info";
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  forecast: number;
  lastMonth: number;
  change: number;
  accuracy: number;
  stock: number;
  reorderPoint: number;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductChartPoint {
  day: string;
  actual?: number;
  forecast?: number;
}

export interface AIInsight { text: string; type: string; }

export interface ProductDetailResponse {
  product: Product;
  chartData: ProductChartPoint[];
  insights: AIInsight[];
}

export interface Category {
  name: string;
  products: number;
  accuracy: number;
  trend: "up" | "down" | "stable";
}

export interface ForecastModel {
  name: string;
  displayName: string;
  accuracy: number;
  status: "active" | "winner";
  detail: string;
}

export interface CategoryAccuracy {
  name: string;
  accuracy: number;
  products: number;
}

export interface Promotion {
  id: number;
  name: string;
  status: "active" | "scheduled" | "completed";
  startDate: string;
  endDate: string;
  category: string;
  impact?: string;
  forecastAdjusted: boolean;
  revenue?: string;
}

export interface PromotionCreate {
  name: string;
  startDate: string;
  endDate: string;
  category: string;
  impact?: string;
  forecastAdjusted?: boolean;
  revenue?: string;
}

export interface Report {
  id: number;
  name: string;
  type: string;
  date: string;
  status: "delivered" | "scheduled" | "generating";
  recipients: string;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  provider: string;
  status: "connected" | "disconnected";
  lastSync: string;
  dataPoints: string;
  impact: string;
}

export interface ModelResult {
  modelName: string;
  accuracy: number;
  mae: number;
  rmse: number;
  isWinner: boolean;
}

export interface PipelineJobResult {
  jobId: string;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
  progressPct?: number;
  currentStep?: string;
  error?: string;
  winnerModel?: string;
  modelResults?: ModelResult[];
  forecastData?: { date: string; predicted: number }[];
  filename?: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

// Dashboard
export const getDashboardKpis = () => request<KPI[]>("/api/dashboard/kpis");
export const getForecastChart = () => request<ForecastChartResponse>("/api/dashboard/forecast-chart");
export const getActivity = () => request<ActivityLogItem[]>("/api/dashboard/activity");
export const getTopProducts = () => request<TopProduct[]>("/api/dashboard/top-products");
export const getInsights = () => request<InsightsResponse>("/api/dashboard/insights");

// Products
export const getProducts = (search: string, category: string, page = 1) =>
  request<ProductListResponse>(
    `/api/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&page=${page}&page_size=100`
  );
export const getProduct = (id: string) =>
  request<ProductDetailResponse>(`/api/products/${id}`);

// Categories
export const getCategories = () => request<Category[]>("/api/categories");

// Forecasts
export const getForecastModels = () => request<ForecastModel[]>("/api/forecasts/models");
export const getAccuracyByCategory = () => request<CategoryAccuracy[]>("/api/forecasts/accuracy-by-category");

// Promotions
export const getPromotions = (status?: string) =>
  request<Promotion[]>(`/api/promotions${status ? `?status=${status}` : ""}`);

export const createPromotion = (body: PromotionCreate) =>
  request<Promotion>("/api/promotions", {
    method: "POST",
    body: JSON.stringify({
      name: body.name,
      start_date: body.startDate,
      end_date: body.endDate,
      category: body.category,
      impact: body.impact,
      forecast_adjusted: body.forecastAdjusted ?? false,
      revenue: body.revenue,
    }),
  });

export const deletePromotion = (id: number) =>
  fetch(`${BASE_URL}/api/promotions/${id}`, { method: "DELETE" });

// Reports
export const getReports = () => request<Report[]>("/api/reports");

export const generateReport = (name: string, type: string, recipients: string) =>
  request<Report>("/api/reports/generate", {
    method: "POST",
    body: JSON.stringify({ name, type, recipients }),
  });

// Integrations
export const getIntegrations = () => request<Integration[]>("/api/settings/integrations");

export const connectIntegration = (id: string) =>
  request<Integration>(`/api/settings/integrations/${id}/connect`, { method: "POST" });

export const disconnectIntegration = (id: string) =>
  request<Integration>(`/api/settings/integrations/${id}/disconnect`, { method: "POST" });

export const refreshIntegration = (id: string) =>
  request<Integration>(`/api/settings/integrations/${id}/refresh`, { method: "POST" });

// Pipeline
export const uploadCsv = async (file: File) => {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/api/pipeline/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return camelizeKeys(await res.json()) as { jobId: string; status: string; message: string };
};

export const getPipelineJob = (jobId: string) =>
  request<PipelineJobResult>(`/api/pipeline/jobs/${jobId}`);
