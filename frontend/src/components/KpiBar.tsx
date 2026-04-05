import { motion } from "framer-motion";
import { useKpis } from "@/hooks/useApi";
import { TrendingUp, DollarSign, Leaf, Package } from "lucide-react";

const ICONS = [TrendingUp, DollarSign, Leaf, Package];

const KpiBar = () => {
  const { data: metrics = [] } = useKpis();
  return (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {metrics.map((kpi, i) => {
      const Icon = ICONS[i];
      return (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          className="bg-card border border-border rounded-xl px-5 py-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-subhead">{kpi.label}</span>
            <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
          </div>
          <div className="text-2xl font-display font-bold tracking-tight text-foreground">{kpi.value}</div>
          <span className="text-[11px] text-success mt-1 block">{kpi.delta}</span>
        </motion.div>
      );
    })}
  </div>
  );
};

export default KpiBar;
