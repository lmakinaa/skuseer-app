import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Cpu, BarChart3, Package } from "lucide-react";
import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import { useForecastRun, useArchiveForecastRun, useUnarchiveForecastRun } from "@/hooks/useApi";

const ForecastDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: forecast } = useForecastRun(id ?? "");
  const archiveForecastRun = useArchiveForecastRun();
  const unarchiveForecastRun = useUnarchiveForecastRun();
  const [tableTab, setTableTab] = useState<"results" | "daily">("results");

  if (!forecast) {
    return (
      <PageLayout title="Forecast Not Found">
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Forecast run not found</p>
          <button onClick={() => navigate("/forecasts")} className="text-primary hover:underline text-sm">← Back to Forecasts</button>
        </div>
      </PageLayout>
    );
  }

  const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    completed: { color: "text-success", icon: CheckCircle, label: "Completed" },
    running: { color: "text-warning", icon: Clock, label: "Running" },
    failed: { color: "text-destructive", icon: AlertCircle, label: "Failed" },
    archived: { color: "text-muted-foreground", icon: Clock, label: "Archived" },
  };
  const st = statusConfig[forecast.status] || statusConfig.completed;

  const handleArchive = () => {
    if (!window.confirm(`Archive ${forecast.name}? It will be hidden from active forecast lists.`)) return;
    archiveForecastRun.mutate(forecast.id, {
      onSuccess: () => navigate("/forecasts"),
    });
  };

  const handleUnarchive = () => {
    if (!window.confirm(`Restore ${forecast.name}? It will return to the active forecast list.`)) return;
    unarchiveForecastRun.mutate(forecast.id, {
      onSuccess: () => navigate("/forecasts"),
    });
  };

  const details = [
    { label: "Forecast ID", value: forecast.id },
    { label: "Model Used", value: forecast.model },
    { label: "Launched At", value: forecast.launchedAt },
    { label: "Finished At", value: forecast.finishedAt || "—" },
    { label: "Duration", value: forecast.duration },
    { label: "Products Scope", value: forecast.products },
    { label: "Products Processed", value: `${forecast.productsCount} SKUs` },
    { label: "Average Accuracy", value: forecast.accuracy ? `${forecast.accuracy}%` : "—" },
  ];

  const dailyForecastPoints = [...(forecast.forecastPoints ?? [])].sort((a, b) => {
    if (a.sku !== b.sku) return a.sku.localeCompare(b.sku);
    return a.date.localeCompare(b.date);
  });

  return (
    <PageLayout title={forecast.name} subtitle={forecast.id}>
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => navigate("/forecasts")} className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Forecasts
        </button>
        {forecast.status === "archived" ? (
          <button onClick={handleUnarchive} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            Restore Forecast
          </button>
        ) : (
          <button onClick={handleArchive} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            Archive Forecast
          </button>
        )}
      </div>

      {/* Status banner */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className={`bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-3`}>
        <st.icon className={`w-5 h-5 ${st.color}`} />
        <div className="flex-1">
          <span className={`text-[14px] font-medium ${st.color}`}>{st.label}</span>
          <p className="text-[12px] text-muted-foreground mt-0.5">{forecast.summary}</p>
        </div>
      </motion.div>

      {/* Details grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Products", value: `${forecast.productsCount}`, icon: Package },
          { label: "Model", value: forecast.model, icon: Cpu },
          { label: "Duration", value: forecast.duration, icon: Clock },
          { label: "Accuracy", value: forecast.accuracy ? `${forecast.accuracy}%` : "—", icon: BarChart3 },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card border border-border rounded-xl px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-subhead">{kpi.label}</span>
              <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center">
                <kpi.icon className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
            <div className="text-xl font-display font-bold tracking-tight text-foreground">{kpi.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Full details */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-xl p-5">
        <span className="text-[13px] font-medium text-foreground block mb-4">Run Details</span>
        <div className="space-y-3 text-[13px]">
          {details.map(d => (
            <div key={d.label} className="flex justify-between">
              <span className="text-muted-foreground">{d.label}</span>
              <span className="text-foreground font-medium font-mono text-[12px]">{d.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Forecast tables */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <span className="text-[13px] font-medium text-foreground">Forecast Data</span>
          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
            <button
              onClick={() => setTableTab("results")}
              className={`px-3 py-1.5 rounded-md text-[12px] transition-colors ${
                tableTab === "results" ? "bg-card text-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Results by Product
            </button>
            <button
              onClick={() => setTableTab("daily")}
              className={`px-3 py-1.5 rounded-md text-[12px] transition-colors ${
                tableTab === "daily" ? "bg-card text-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Daily Forecast Points
            </button>
          </div>
        </div>

        {tableTab === "results" ? (
          forecast.results.length > 0 ? (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 text-subhead font-medium">SKU</th>
                  <th className="text-left px-4 py-3 text-subhead font-medium">Product</th>
                  <th className="text-right px-4 py-3 text-subhead font-medium">30-Day Forecast</th>
                  <th className="text-right px-4 py-3 text-subhead font-medium">Accuracy</th>
                  <th className="text-right px-4 py-3 text-subhead font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {forecast.results.map((r: any) => (
                  <tr key={r.sku} className="border-b border-border/50 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/products/${r.sku}`)}>
                    <td className="px-4 py-3 font-mono text-muted-foreground text-[11px]">{r.sku}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                    <td className="px-4 py-3 text-right font-mono">{r.forecast.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono">{r.accuracy}%</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${r.status === "good" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                        {r.status === "good" ? "Good" : "Needs Review"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-8 text-center text-[12px] text-muted-foreground">No forecast product results yet.</div>
          )
        ) : (
          dailyForecastPoints.length > 0 ? (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 text-subhead font-medium">SKU</th>
                  <th className="text-left px-4 py-3 text-subhead font-medium">Date</th>
                  <th className="text-right px-4 py-3 text-subhead font-medium">Predicted Quantity</th>
                </tr>
              </thead>
              <tbody>
                {dailyForecastPoints.map((p, idx) => (
                  <tr key={`${p.sku}-${p.date}-${idx}`} className="border-b border-border/50">
                    <td className="px-4 py-3 font-mono text-muted-foreground text-[11px]">{p.sku}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground text-[11px]">{p.date}</td>
                    <td className="px-4 py-3 text-right font-mono">{Math.round(p.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-8 text-center text-[12px] text-muted-foreground">No daily forecast points available yet.</div>
          )
        )}
      </motion.div>
    </PageLayout>
  );
};

export default ForecastDetail;
