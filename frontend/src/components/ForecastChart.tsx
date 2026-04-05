import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useForecastChart } from "@/hooks/useApi";
import { TrendingUp } from "lucide-react";

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-md text-[11px]">
      <p className="text-muted-foreground mb-1.5 font-mono-data">{label}</p>
      {payload.filter(p => p.value != null).map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-foreground capitalize">{p.name}:</span>
          <span className="text-foreground font-mono-data font-medium">${p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const ForecastChart = () => {
  const { data: chartResponse } = useForecastChart();
  const chartData = chartResponse?.data ?? [];
  const todayMarker = chartResponse?.todayMarker ?? "Today";
  return (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.2 }}
    className="bg-card border border-border rounded-xl p-5"
  >
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-[13px] font-medium text-foreground">Revenue Forecast</span>
        <span className="text-[11px] text-muted-foreground ml-1">— Daily, all categories</span>
      </div>
      <div className="flex items-center gap-4 text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-[2px] bg-foreground/40 rounded" />
          <span className="text-muted-foreground">Actual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-[2px] bg-primary rounded" />
          <span className="text-muted-foreground">Forecast</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-[2px] bg-primary/20 rounded" />
          <span className="text-muted-foreground">Confidence range</span>
        </div>
      </div>
    </div>
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(217, 72%, 50%)" stopOpacity={0.15} />
            <stop offset="100%" stopColor="hsl(217, 72%, 50%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(220, 10%, 46%)" }} tickLine={false} axisLine={{ stroke: "hsl(220, 13%, 91%)" }} interval={10} />
        <YAxis tick={{ fontSize: 10, fill: "hsl(220, 10%, 46%)" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine x={todayMarker} stroke="hsl(220, 10%, 78%)" strokeDasharray="4 4" label={{ value: "Today", position: "top", fontSize: 10, fill: "hsl(220, 10%, 46%)" }} />
        <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(217, 72%, 50%)" fillOpacity={0.06} />
        <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(0, 0%, 100%)" fillOpacity={1} />
        <Area type="monotone" dataKey="actual" stroke="hsl(220, 20%, 50%)" strokeWidth={1.5} fill="none" dot={false} />
        <Area type="monotone" dataKey="forecast" stroke="hsl(217, 72%, 50%)" strokeWidth={2} fill="url(#colorForecast)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  </motion.div>
  );
};

export default ForecastChart;
