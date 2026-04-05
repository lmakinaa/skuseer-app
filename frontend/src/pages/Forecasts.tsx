import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Play, Clock, CheckCircle, AlertCircle, Cpu } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { useForecastRuns, useForecastModels, useAccuracyByCategory, useCreateForecastRun, useCategories } from "@/hooks/useApi";

const Forecasts = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"runs" | "models" | "accuracy">("runs");

  const { data: apiForecastRuns = [] } = useForecastRuns();
  const { data: models = [] } = useForecastModels();
  const { data: apiAccuracy = [] } = useAccuracyByCategory();
  const { data: categories = [] } = useCategories();
  const createRun = useCreateForecastRun();

  const categoryChartData = (apiAccuracy.length ? apiAccuracy : categories).map(c => ({
    name: c.name,
    accuracy: c.accuracy,
    products: c.products,
  }));

  const handleNewForecast = () => {
    createRun.mutate({ name: "Full Catalog Forecast", model: "Smart Forecast" });
  };

  const statusConfig: Record<string, { color: string; icon: any; bg: string }> = {
    completed: { color: "text-success", icon: CheckCircle, bg: "bg-success/10" },
    running: { color: "text-warning", icon: Clock, bg: "bg-warning/10" },
    failed: { color: "text-destructive", icon: AlertCircle, bg: "bg-destructive/10" },
  };

  return (
    <PageLayout title="Forecasts" subtitle="AI-powered demand predictions">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
          {[
            { key: "runs" as const, label: "Forecast Runs" },
            { key: "models" as const, label: "Models" },
            { key: "accuracy" as const, label: "Accuracy" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-md text-[12px] transition-colors ${
                activeTab === tab.key ? "bg-card text-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
        <button onClick={handleNewForecast}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] bg-primary text-primary-foreground font-medium hover:bg-primary/90">
          <Play className="w-3.5 h-3.5" /> New Forecast Run
        </button>
      </div>

      {activeTab === "runs" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 text-subhead font-medium">Run ID</th>
                <th className="text-left px-4 py-3 text-subhead font-medium">Name</th>
                <th className="text-left px-4 py-3 text-subhead font-medium">Date</th>
                <th className="text-left px-4 py-3 text-subhead font-medium">Model</th>
                <th className="text-right px-4 py-3 text-subhead font-medium">Products</th>
                <th className="text-right px-4 py-3 text-subhead font-medium">Accuracy</th>
                <th className="text-right px-4 py-3 text-subhead font-medium">Duration</th>
                <th className="text-right px-4 py-3 text-subhead font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {apiForecastRuns.map(run => {
                const st = statusConfig[run.status] ?? statusConfig.completed;
                return (
                  <tr key={run.id} onClick={() => navigate(`/forecasts/${run.id}`)}
                    className="border-b border-border/50 hover:bg-accent/50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-mono text-muted-foreground text-[11px]">{run.id}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{run.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{run.date}</td>
                    <td className="px-4 py-3 text-muted-foreground flex items-center gap-1.5">
                      <Cpu className="w-3 h-3" /> {run.model}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{run.products}</td>
                    <td className="px-4 py-3 text-right font-mono">{run.accuracy ? `${run.accuracy}%` : "—"}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">{run.duration}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                        <st.icon className="w-3 h-3" />
                        {run.status === "completed" ? "Completed" : run.status === "running" ? "Running" : "Failed"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      {activeTab === "models" && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {models.map((model: any, i: number) => {
              const iconMap: Record<string, string> = { "Trend Analyzer": "📊", "Smart Forecast": "🏆", "Pattern Finder": "🔍", "Classic Predictor": "📈" };
              const displayName = model.displayName ?? model.name;
              const icon = model.icon ?? iconMap[displayName] ?? "📊";
              return (
              <motion.div key={displayName} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={`bg-card border rounded-xl p-4 ${model.status === "winner" ? "border-primary ring-1 ring-primary/20" : "border-border"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{icon}</span>
                  {model.status === "winner" && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Best Model</span>
                  )}
                </div>
                <div className="text-[13px] font-medium text-foreground">{displayName}</div>
                <div className="text-2xl font-display font-bold text-foreground mt-1">{model.accuracy}%</div>
                <p className="text-[11px] text-muted-foreground mt-1">{model.detail}</p>
              </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "accuracy" && (
        <>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-[13px] font-medium text-foreground mb-5">Accuracy by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} tickLine={false} />
                <YAxis domain={[88, 100]} tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip formatter={(value: number) => [`${value}%`, "Accuracy"]}
                  contentStyle={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 13%, 91%)", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                  {categoryChartData.map((_, i) => (
                    <Cell key={i} fill={`hsl(217, 72%, ${45 + i * 5}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 text-subhead font-medium">Category</th>
                  <th className="text-right px-4 py-3 text-subhead font-medium">Products</th>
                  <th className="text-right px-4 py-3 text-subhead font-medium">Accuracy</th>
                  <th className="text-right px-4 py-3 text-subhead font-medium">Trend</th>
                  <th className="text-right px-4 py-3 text-subhead font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {categoryChartData.map(cat => (
                  <tr key={cat.name} className="border-b border-border/50">
                    <td className="px-4 py-3 font-medium text-foreground">{cat.name}</td>
                    <td className="px-4 py-3 text-right font-mono-data text-muted-foreground">{cat.products}</td>
                    <td className="px-4 py-3 text-right font-mono-data">{cat.accuracy}%</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-[12px] capitalize ${cat.accuracy >= 96 ? "text-success" : cat.accuracy >= 95 ? "text-muted-foreground" : "text-destructive"}`}>
                        {cat.accuracy >= 96 ? "↑ Improving" : cat.accuracy >= 95 ? "→ Stable" : "↓ Declining"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${cat.accuracy >= 96 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                        {cat.accuracy >= 96 ? "On Track" : "Needs Review"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </>
      )}
    </PageLayout>
  );
};

export default Forecasts;
