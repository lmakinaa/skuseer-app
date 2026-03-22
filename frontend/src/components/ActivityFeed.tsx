import { motion } from "framer-motion";
import { useActivity } from "@/hooks/useApi";
import { Activity, CheckCircle, AlertTriangle, Info } from "lucide-react";

const typeConfig = {
  success: { icon: CheckCircle, color: "text-success" },
  warning: { icon: AlertTriangle, color: "text-warning" },
  info: { icon: Info, color: "text-primary" },
};

const ActivityFeed = () => {
  const { data: logs = [] } = useActivity();
  return (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.3 }}
    className="bg-card border border-border rounded-xl p-5 h-full"
  >
    <div className="flex items-center gap-2 mb-4">
      <Activity className="w-4 h-4 text-primary" />
      <span className="text-[13px] font-medium text-foreground">AI Activity</span>
    </div>
    <div className="space-y-3">
      {logs.map((log, i) => {
        const config = typeConfig[log.type];
        const Icon = config.icon;
        return (
          <div key={i} className="flex gap-2.5">
            <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${config.color}`} />
            <div className="min-w-0">
              <p className="text-[12px] text-foreground leading-relaxed">{log.text}</p>
              <span className="text-[10px] text-muted-foreground">{log.time}</span>
            </div>
          </div>
        );
      })}
    </div>
  </motion.div>
  );
};

export default ActivityFeed;
