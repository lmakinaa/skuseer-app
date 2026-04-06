const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ── Auth token & tenant injection ───────────────────────────────────────────
let _accessToken: string | null = null;
let _tenantId: string | null = null;

export function setAuthToken(token: string | null) { _accessToken = token; }
export function setTenantId(id: string | null) { _tenantId = id; }

// ── camelCase transform ───────────────────────────────────────────────────────
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
function authHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  if (_accessToken) h["Authorization"] = `Bearer ${_accessToken}`;
  if (_tenantId) h["X-Tenant-ID"] = _tenantId;
  return h;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders(), ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  const json = await res.json();
  return camelizeKeys(json) as T;
}

async function requestNoContent(path: string, init?: RequestInit): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { ...authHeaders(), ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
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

export interface TopBarSearchResult {
  id: string;
  type: "product" | "category" | "forecast_run";
  title: string;
  subtitle: string;
  path: string;
}

export interface TopBarContextResponse {
  dateLabel: string;
  rangeLabel: string;
  timezone: string;
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
  id: string;
  name: string;
  products: number;
  accuracy: number;
  trend: "up" | "down" | "stable";
  subcategories?: string[];
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
  icon?: string | null;
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

// ── Auth / Tenant / Role types ────────────────────────────────────────────────
export interface UserResponse {
  id: string;
  email: string;
  fullName: string | null;
  isPlatformAdmin: boolean;
}

export interface TenantMembershipResponse {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  roleId: string;
  roleName: string;
}

export interface MeResponse {
  user: UserResponse;
  tenants: TenantMembershipResponse[];
}

export interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  storeId?: string | null;
  location: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  timezone?: string | null;
  operatingHours?: Record<string, string> | null;
  isActive: boolean;
  createdAt: string | null;
  memberCount?: number;
}

export interface MemberResponse {
  userId: string;
  email: string;
  fullName: string | null;
  roleId: string;
  roleName: string;
  isActive: boolean;
  acceptedAt: string | null;
}

export interface PermissionItem {
  id: string;
  codename: string;
  description: string | null;
}

export interface RoleResponse {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
}

export interface RoleWithPermissions extends RoleResponse {
  permissions: PermissionItem[];
}

// ── API functions ─────────────────────────────────────────────────────────────

// Auth
export const getMe = () => request<MeResponse>("/api/auth/me");

// Tenant
export const getCurrentTenant = () => request<TenantResponse>("/api/tenants/current");
export const updateCurrentTenant = (body: {
  name?: string;
  location?: string;
  address?: string;
  phone?: string;
  website?: string;
  timezone?: string;
  operatingHours?: Record<string, string>;
}) =>
  request<TenantResponse>("/api/tenants/current", { method: "PATCH", body: JSON.stringify(body) });
export const getTenantMembers = () => request<MemberResponse[]>("/api/tenants/current/members");
export const inviteMember = (email: string, roleId: string) =>
  request<MemberResponse>("/api/tenants/current/members/invite", {
    method: "POST", body: JSON.stringify({ email, role_id: roleId }),
  });
export const removeMember = (userId: string) =>
  requestNoContent(`/api/tenants/current/members/${userId}`, { method: "DELETE" });
export const changeMemberRole = (userId: string, roleId: string) =>
  request<MemberResponse>(`/api/tenants/current/members/${userId}/role`, {
    method: "PATCH", body: JSON.stringify({ role_id: roleId }),
  });

// Roles
export const getRoles = () => request<RoleResponse[]>("/api/roles/");
export const createRole = (body: { name: string; description?: string }) =>
  request<RoleResponse>("/api/roles/", { method: "POST", body: JSON.stringify(body) });
export const updateRole = (roleId: string, body: { name?: string; description?: string; isDefault?: boolean }) =>
  request<RoleResponse>(`/api/roles/${roleId}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: body.name,
      description: body.description,
      is_default: body.isDefault,
    }),
  });
export const getRolePermissions = (roleId: string) =>
  request<RoleWithPermissions>(`/api/roles/${roleId}`);
export const setRolePermissions = (roleId: string, permissionIds: string[]) =>
  request<RoleWithPermissions>(`/api/roles/${roleId}/permissions`, {
    method: "PUT", body: JSON.stringify({ permission_ids: permissionIds }),
  });
export const deleteRole = (roleId: string) =>
  requestNoContent(`/api/roles/${roleId}`, { method: "DELETE" });
export const getAllPermissions = () => request<PermissionItem[]>("/api/roles/permissions");

// Admin
export const getAdminTenants = () => request<TenantResponse[]>("/api/admin/tenants");
export const createTenant = (body: { name: string; slug: string; location?: string }) =>
  request<TenantResponse>("/api/admin/tenants", { method: "POST", body: JSON.stringify(body) });
export const getAdminUsers = () => request<UserResponse[]>("/api/admin/users");
export const togglePlatformAdmin = (userId: string) =>
  request<UserResponse>(`/api/admin/users/${userId}`, { method: "PATCH" });

// Dashboard
export const getDashboardKpis = () => request<KPI[]>("/api/dashboard/kpis");
export const getForecastChart = () => request<ForecastChartResponse>("/api/dashboard/forecast-chart");
export const getActivity = () => request<ActivityLogItem[]>("/api/dashboard/activity");
export const getTopProducts = () => request<TopProduct[]>("/api/dashboard/top-products");
export const getInsights = () => request<InsightsResponse>("/api/dashboard/insights");
export const getTopBarContext = () => request<TopBarContextResponse>("/api/dashboard/context");
export const searchTopBar = (query: string) =>
  request<TopBarSearchResult[]>(`/api/dashboard/search?q=${encodeURIComponent(query)}`);

// Products
export const getProducts = (search: string, category: string, page = 1) =>
  request<ProductListResponse>(
    `/api/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&page=${page}&page_size=100`
  );
export const getProduct = (id: string) =>
  request<ProductDetailResponse>(`/api/products/${id}`);

export const deleteProduct = (productId: string) =>
  requestNoContent(`/api/products/${productId}`, { method: "DELETE" });

export const createProduct = (body: {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  reorderPoint: number;
}) =>
  request<Product>("/api/products", {
    method: "POST",
    body: JSON.stringify({
      id: body.id,
      name: body.name,
      category: body.category,
      price: body.price,
      stock: body.stock,
      reorder_point: body.reorderPoint,
    }),
  });

export interface ProductImportHistoryItem {
  id: number;
  file: string;
  date: string;
  items: number;
  status: "completed" | "failed" | "processing";
}

export const getProductImportHistory = () =>
  request<ProductImportHistoryItem[]>("/api/products/import/history");

export const importProductsCsv = async (file: File) => {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/api/products/import`, {
    method: "POST",
    body: form,
    headers: authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return camelizeKeys(await res.json()) as ProductImportHistoryItem;
};

export const exportProductsCsv = async (): Promise<Blob> => {
  const res = await fetch(`${BASE_URL}/api/products/export`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return await res.blob();
};

// Sales Data
export interface SalesImportResponse {
  imported: number;
  skipped: number;
}

export const importSalesCsv = async (file: File): Promise<SalesImportResponse> => {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/api/products/sales/import`, {
    method: "POST",
    body: form,
    headers: authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return camelizeKeys(await res.json()) as SalesImportResponse;
};

export const addSalesRecord = (productId: string, body: { date: string; quantity: number }) =>
  request<SalesHistoryPoint>(`/api/products/${productId}/sales`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const importProductSalesCsv = async (productId: string, file: File): Promise<SalesImportResponse> => {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/api/products/${productId}/sales/import`, {
    method: "POST",
    body: form,
    headers: authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return camelizeKeys(await res.json()) as SalesImportResponse;
};

// Categories
export const getCategories = () => request<Category[]>("/api/categories");

export const createCategory = (name: string) =>
  request<Category>("/api/categories", { method: "POST", body: JSON.stringify({ name }) });

export const updateCategory = (categoryId: string, body: { name?: string }) =>
  request<Category>(`/api/categories/${categoryId}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteCategory = (categoryId: string) =>
  requestNoContent(`/api/categories/${categoryId}`, { method: "DELETE" });

export const createSubcategory = (categoryId: string, name: string) =>
  request<Category>(`/api/categories/${categoryId}/subcategories`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });

// Forecasts
export const getForecastModels = () => request<ForecastModel[]>("/api/forecasts/models");
export const getAccuracyByCategory = () => request<CategoryAccuracy[]>("/api/forecasts/accuracy-by-category");

// Forecast Runs
export interface ForecastRunListItem {
  id: string;
  name: string;
  date: string;
  status: string;
  products: number;
  accuracy: number | null;
  duration: string;
  model: string;
}

export interface ForecastRunResultItem {
  sku: string;
  name: string;
  forecast: number;
  accuracy: number;
  status: string;
}

export interface ForecastPointItem {
  sku: string;
  date: string;
  quantity: number;
}

export interface ForecastRunDetail {
  id: string;
  name: string;
  status: string;
  launchedAt: string;
  finishedAt: string | null;
  duration: string;
  model: string;
  accuracy: number | null;
  productsCount: number;
  products: string;
  summary: string;
  results: ForecastRunResultItem[];
  forecastPoints: ForecastPointItem[];
}

export const getForecastRuns = (productId?: string, includeArchived = false) => {
  const params = new URLSearchParams();
  if (productId) params.set("product_id", productId);
  if (includeArchived) params.set("include_archived", "true");
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return request<ForecastRunListItem[]>(`/api/forecasts/runs${suffix}`);
};

export const getForecastRun = (runId: string) =>
  request<ForecastRunDetail>(`/api/forecasts/runs/${runId}`);

export const archiveForecastRun = (runId: string) =>
  request<ForecastRunDetail>(`/api/forecasts/runs/${runId}/archive`, { method: "POST" });

export const archiveForecastRuns = (runIds: string[]) =>
  request<ForecastRunListItem[]>("/api/forecasts/runs/archive", {
    method: "POST",
    body: JSON.stringify({ run_ids: runIds }),
  });

export const unarchiveForecastRun = (runId: string) =>
  request<ForecastRunDetail>(`/api/forecasts/runs/${runId}/unarchive`, { method: "POST" });

export const unarchiveForecastRuns = (runIds: string[]) =>
  request<ForecastRunListItem[]>("/api/forecasts/runs/unarchive", {
    method: "POST",
    body: JSON.stringify({ run_ids: runIds }),
  });

export const createForecastRun = (body: { name: string; model?: string; productIds?: string[] }) =>
  request<ForecastRunListItem>("/api/forecasts/runs", {
    method: "POST",
    body: JSON.stringify({
      name: body.name,
      model: body.model ?? "Smart Forecast",
      product_ids: body.productIds ?? [],
    }),
  });

// Product Sales History
export interface SalesHistoryPoint {
  date: string;
  sales: number;
}

export const getProductSalesHistory = (productId: string, days = 90) =>
  request<SalesHistoryPoint[]>(`/api/products/${productId}/sales-history?days=${days}`);

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
  fetch(`${BASE_URL}/api/promotions/${id}`, { method: "DELETE", headers: authHeaders() });

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
  const res = await fetch(`${BASE_URL}/api/pipeline/upload`, {
    method: "POST",
    body: form,
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return camelizeKeys(await res.json()) as { jobId: string; status: string; message: string };
};

export const getPipelineJob = (jobId: string) =>
  request<PipelineJobResult>(`/api/pipeline/jobs/${jobId}`);
