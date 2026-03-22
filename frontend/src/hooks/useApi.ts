import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const useKpis = () =>
  useQuery({ queryKey: ["dashboard", "kpis"], queryFn: api.getDashboardKpis });

export const useForecastChart = () =>
  useQuery({ queryKey: ["dashboard", "chart"], queryFn: api.getForecastChart });

export const useActivity = () =>
  useQuery({ queryKey: ["dashboard", "activity"], queryFn: api.getActivity, refetchInterval: 30_000 });

export const useTopProducts = () =>
  useQuery({ queryKey: ["dashboard", "topProducts"], queryFn: api.getTopProducts });

export const useInsights = () =>
  useQuery({ queryKey: ["dashboard", "insights"], queryFn: api.getInsights });

// ── Products ──────────────────────────────────────────────────────────────────
export const useProducts = (search: string, category: string) =>
  useQuery({
    queryKey: ["products", search, category],
    queryFn: () => api.getProducts(search, category),
    placeholderData: (prev) => prev,
  });

export const useProduct = (id: string) =>
  useQuery({
    queryKey: ["product", id],
    queryFn: () => api.getProduct(id),
    enabled: !!id,
  });

// ── Categories ────────────────────────────────────────────────────────────────
export const useCategories = () =>
  useQuery({ queryKey: ["categories"], queryFn: api.getCategories });

// ── Forecasts ─────────────────────────────────────────────────────────────────
export const useForecastModels = () =>
  useQuery({ queryKey: ["forecastModels"], queryFn: api.getForecastModels });

export const useAccuracyByCategory = () =>
  useQuery({ queryKey: ["accuracyByCategory"], queryFn: api.getAccuracyByCategory });

// ── Promotions ────────────────────────────────────────────────────────────────
export const usePromotions = () =>
  useQuery({ queryKey: ["promotions"], queryFn: () => api.getPromotions() });

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
export const useReports = () =>
  useQuery({ queryKey: ["reports"], queryFn: api.getReports });

export const useGenerateReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, type, recipients }: { name: string; type: string; recipients: string }) =>
      api.generateReport(name, type, recipients),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
};

// ── Integrations ──────────────────────────────────────────────────────────────
export const useIntegrations = () =>
  useQuery({ queryKey: ["integrations"], queryFn: api.getIntegrations });

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

export const usePipelineJob = (jobId: string | null) =>
  useQuery({
    queryKey: ["pipelineJob", jobId],
    queryFn: () => api.getPipelineJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" || status === "failed" ? false : 2000;
    },
  });
