import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import PageLayout from "@/components/PageLayout";
import { useForecastModels, useAccuracyByCategory, useCategories } from "@/hooks/useApi";

// Icons mapped by canonical model name
const MODEL_ICONS: Record<string, string> = {
  ARIMA: "📊",
  Prophet: "🏆",
  XGBoost: "🔍",
  LSTM: "📈",
};

const Forecasts = () => {
  const { data: models = [] } = useForecastModels();
  const { data: accuracyData = [] } = useAccuracyByCategory();
  const { data: categories = [] } = useCategories();

  return (
  <PageLayout title="Forecasts" subtitle="AI-powered demand predictions">
    {/* Models overview */}
    <div>
      <h3 className="text-[13px] font-medium text-foreground mb-3">Active Forecast Models</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {models.map((model, i) => (
          <motion.div
            key={model.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`bg-card border rounded-xl p-4 ${model.status === "winner" ? "border-primary ring-1 ring-primary/20" : "border-border"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{MODEL_ICONS[model.name] ?? "🤖"}</span>
              {model.status === "winner" && (
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Best Model</span>
              )}
            </div>
            <div className="text-[13px] font-medium text-foreground">{model.displayName}</div>
            <div className="text-2xl font-display font-bold text-foreground mt-1">{model.accuracy}%</div>
            <p className="text-[11px] text-muted-foreground mt-1">{model.detail}</p>
          </motion.div>
        ))}
      </div>
    </div>

    {/* Category accuracy chart */}
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card border border-border rounded-xl p-5"
    >
      <h3 className="text-[13px] font-medium text-foreground mb-5">Accuracy by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={accuracyData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} tickLine={false} />
          <YAxis domain={[88, 100]} tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip
            formatter={(value: number) => [`${value}%`, "Accuracy"]}
            contentStyle={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 13%, 91%)", borderRadius: "8px", fontSize: "12px" }}
          />
          <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
            {accuracyData.map((_, i) => (
              <Cell key={i} fill={`hsl(217, 72%, ${45 + i * 5}%)`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>

    {/* Category table */}
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
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
          {categories.map(cat => (
            <tr key={cat.name} className="border-b border-border/50">
              <td className="px-4 py-3 font-medium text-foreground">{cat.name}</td>
              <td className="px-4 py-3 text-right font-mono-data text-muted-foreground">{cat.products}</td>
              <td className="px-4 py-3 text-right font-mono-data">{cat.accuracy}%</td>
              <td className="px-4 py-3 text-right">
                <span className={`text-[12px] capitalize ${cat.trend === "up" ? "text-success" : cat.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                  {cat.trend === "up" ? "↑ Improving" : cat.trend === "down" ? "↓ Declining" : "→ Stable"}
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
  </PageLayout>
  );
};

export default Forecasts;
