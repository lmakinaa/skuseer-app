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

// ── Categories ────────────────────────────────────────────────────────────────
export const useCategories = () => {
  const tid = useTenantId();
  return useQuery({ queryKey: ["categories", tid], queryFn: api.getCategories, enabled: !!tid });
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
