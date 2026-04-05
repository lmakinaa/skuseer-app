import { motion } from "framer-motion";
import { CloudRain, Calendar, Tag } from "lucide-react";
import { useInsights } from "@/hooks/useApi";

const InsightPanels = () => {
  const { data } = useInsights();
  const weather = data?.weather ?? [];
  const events = data?.events ?? [];
  const promos = data?.promos ?? [];
  return (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <CloudRain className="w-4 h-4 text-primary" />
        <span className="text-[13px] font-medium text-foreground">Weather Impact</span>
      </div>
      <div className="space-y-3">
        {weather.map(w => (
          <div key={w.label} className="flex justify-between items-center">
            <div>
              <div className="text-[12px] text-foreground">{w.label}</div>
              <div className="text-[10px] text-muted-foreground">{w.detail}</div>
            </div>
            <span className="text-success font-mono-data text-sm font-medium">{w.value}</span>
          </div>
        ))}
      </div>
    </motion.div>

    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-warning" />
        <span className="text-[13px] font-medium text-foreground">Upcoming Events</span>
      </div>
      <div className="space-y-3">
        {events.map(e => (
          <div key={e.label} className="flex justify-between items-center">
            <div>
              <div className="text-[12px] text-foreground">{e.label}</div>
              <div className="text-[10px] text-muted-foreground">{e.date} · {e.detail}</div>
            </div>
            <span className="text-warning font-mono-data text-sm font-medium">{e.impact}</span>
          </div>
        ))}
      </div>
    </motion.div>

    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-4 h-4 text-primary" />
        <span className="text-[13px] font-medium text-foreground">Promotions Tracked</span>
      </div>
      <div className="space-y-3">
        {promos.map(p => (
          <div key={p.label} className="flex justify-between items-center">
            <div>
              <div className="text-[12px] text-foreground">{p.label}</div>
              <div className="text-[10px] text-muted-foreground">{p.date}</div>
            </div>
            <div className="text-right">
              <span className="text-foreground font-mono-data text-sm">{p.spike}</span>
              <div className="text-[9px] text-success">✓ {p.note}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  </div>
  );
};

export default InsightPanels;
