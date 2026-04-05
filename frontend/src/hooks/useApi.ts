import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { useTenant } from "@/auth/TenantContext";

function useTenantId() {
  const { currentTenant } = useTenant();
  return currentTenant?.tenantId ?? "";
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const useKpis = () => {
  const tid = useTenantId();
  return useQuery({ queryKey: ["dashboard", "kpis", tid], queryFn: api.getDashboardKpis, enabled: !!tid });
};

export const useForecastChart = () => {
  const tid = useTenantId();
  return useQuery({ queryKey: ["dashboard", "chart", tid], queryFn: api.getForecastChart, enabled: !!tid });
};

export const useActivity = () => {
  const tid = useTenantId();
  return useQuery({ queryKey: ["dashboard", "activity", tid], queryFn: api.getActivity, refetchInterval: 30_000, enabled: !!tid });
};

export const useTopProducts = () => {
  const tid = useTenantId();
  return useQuery({ queryKey: ["dashboard", "topProducts", tid], queryFn: api.getTopProducts, enabled: !!tid });
};

export const useInsights = () => {
  const tid = useTenantId();
  return useQuery({ queryKey: ["dashboard", "insights", tid], queryFn: api.getInsights, enabled: !!tid });
};

// ── Products ──────────────────────────────────────────────────────────────────
export const useProducts = (search: string, category: string) => {
  const tid = useTenantId();
  return useQuery({
    queryKey: ["products", tid, search, category],
    queryFn: () => api.getProducts(search, category),
    placeholderData: (prev) => prev,
    enabled: !!tid,
  });
};

export const useProduct = (id: string) => {
  const tid = useTenantId();
  return useQuery({
    queryKey: ["product", tid, id],
    queryFn: () => api.getProduct(id),
    enabled: !!id && !!tid,
  });
};

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
};

export const useProductImportHistory = () => {
  const tid = useTenantId();
  return useQuery({ queryKey: ["productImportHistory", tid], queryFn: api.getProductImportHistory, enabled: !!tid });
};

export const useImportProductsCsv = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.importProductsCsv,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["productImportHistory"] });
    },
  });
};

export const useExportProductsCsv = () => {
  return useMutation({ mutationFn: api.exportProductsCsv });
};

// ── Categories ────────────────────────────────────────────────────────────────
export const useCategories = () => {
  const tid = useTenantId();
  return useQuery({ queryKey: ["categories", tid], queryFn: api.getCategories, enabled: !!tid });
};

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, body }: { categoryId: string; body: { name?: string } }) => api.updateCategory(categoryId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
};

export const useCreateSubcategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, name }: { categoryId: string; name: string }) => api.createSubcategory(categoryId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
};

// ── Forecasts ─────────────────────────────────────────────────────────────────
export const useForecastModels = () => {
  const tid = useTenantId();
  return useQuery({ queryKey: ["forecastModels", tid], queryFn: api.getForecastModels, enabled: !!tid });
};

export const useAccuracyByCategory = () => {
  const tid = useTenantId();
  return useQuery({ queryKey: ["accuracyByCategory", tid], queryFn: api.getAccuracyByCategory, enabled: !!tid });
};

// ── Forecast Runs ────────────────────────────────────────────────────────────
export const useForecastRuns = (productId?: string) => {
  const tid = useTenantId();
  return useQuery({
    queryKey: ["forecastRuns", tid, productId ?? ""],
    queryFn: () => api.getForecastRuns(productId),
    enabled: !!tid,
  });
};

export const useForecastRun = (runId: string) => {
  const tid = useTenantId();
  return useQuery({
    queryKey: ["forecastRun", tid, runId],
    queryFn: () => api.getForecastRun(runId),
    enabled: !!runId && !!tid,
  });
};

export const useCreateForecastRun = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createForecastRun,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forecastRuns"] }),
  });
};

// ── Product Sales History ────────────────────────────────────────────────────
export const useProductSalesHistory = (productId: string) => {
  const tid = useTenantId();
  return useQuery({
    queryKey: ["productSalesHistory", tid, productId],
    queryFn: () => api.getProductSalesHistory(productId),
    enabled: !!productId && !!tid,
  });
};

// ── Promotions ────────────────────────────────────────────────────────────────
export const usePromotions = () => {
  const tid = useTenantId();
  return useQuery({ queryKey: ["promotions", tid], queryFn: () => api.getPromotions(), enabled: !!tid });
};

export const useCreatePromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createPromotion,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotions"] }),
  });
};

export const useDeletePromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deletePromotion,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotions"] }),
  });
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const useReports = () => {
  const tid = useTenantId();
  return useQuery({ queryKey: ["reports", tid], queryFn: api.getReports, enabled: !!tid });
};

export const useGenerateReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, type, recipients }: { name: string; type: string; recipients: string }) =>
      api.generateReport(name, type, recipients),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
};

// ── Integrations ──────────────────────────────────────────────────────────────
export const useIntegrations = () => {
  const tid = useTenantId();
  return useQuery({ queryKey: ["integrations", tid], queryFn: api.getIntegrations, enabled: !!tid });
};

export const useConnectIntegration = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.connectIntegration,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integrations"] }),
  });
};

export const useDisconnectIntegration = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.disconnectIntegration,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integrations"] }),
  });
};

export const useRefreshIntegration = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.refreshIntegration,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integrations"] }),
  });
};

// ── Tenant / Members / Roles ───────────────────────────────────────────────
export const useCurrentTenant = () => {
  const tid = useTenantId();
  return useQuery({ queryKey: ["tenant", "current", tid], queryFn: api.getCurrentTenant, enabled: !!tid });
};

export const useUpdateCurrentTenant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.updateCurrentTenant,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenant", "current"] }),
  });
};

export const useTenantMembers = () => {
  const tid = useTenantId();
  return useQuery({ queryKey: ["tenant", "members", tid], queryFn: api.getTenantMembers, enabled: !!tid });
};

export const useInviteMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, roleId }: { email: string; roleId: string }) => api.inviteMember(email, roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenant", "members"] }),
  });
};

export const useRemoveMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.removeMember,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenant", "members"] }),
  });
};

export const useRoles = () => {
  const tid = useTenantId();
  return useQuery({ queryKey: ["roles", tid], queryFn: api.getRoles, enabled: !!tid });
};

export const useAllPermissions = () => {
  const tid = useTenantId();
  return useQuery({ queryKey: ["permissions", tid], queryFn: api.getAllPermissions, enabled: !!tid });
};

export const useCreateRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createRole,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
};

export const useUpdateRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, body }: { roleId: string; body: { name?: string; description?: string; isDefault?: boolean } }) =>
      api.updateRole(roleId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
};

export const useRolePermissions = (roleId: string | null) => {
  const tid = useTenantId();
  return useQuery({
    queryKey: ["rolePermissions", tid, roleId],
    queryFn: () => api.getRolePermissions(roleId!),
    enabled: !!tid && !!roleId,
  });
};

export const useSetRolePermissions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      api.setRolePermissions(roleId, permissionIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rolePermissions"] }),
  });
};

export const useDeleteRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteRole,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["tenant", "members"] });
    },
  });
};

// ── Pipeline ──────────────────────────────────────────────────────────────────
export const useUploadCsv = () =>
  useMutation({ mutationFn: api.uploadCsv });

export const usePipelineJob = (jobId: string | null) => {
  const tid = useTenantId();
  return useQuery({
    queryKey: ["pipelineJob", tid, jobId],
    queryFn: () => api.getPipelineJob(jobId!),
    enabled: !!jobId && !!tid,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" || status === "failed" ? false : 2000;
    },
  });
};
