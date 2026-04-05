import { motion } from "framer-motion";
import { Megaphone, CheckCircle, Clock, CalendarCheck } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { usePromotions } from "@/hooks/useApi";

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  active: { icon: CheckCircle, color: "bg-success/10 text-success", label: "Active" },
  completed: { icon: Clock, color: "bg-muted text-muted-foreground", label: "Completed" },
  scheduled: { icon: CalendarCheck, color: "bg-primary/10 text-primary", label: "Scheduled" },
};

const Promotions = () => {
  const { data: promotions = [] } = usePromotions();
  return (
  <PageLayout title="Promotions" subtitle={`${promotions.length} total promotions`}>
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Active", count: promotions.filter(p => p.status === "active").length, color: "text-success" },
        { label: "Scheduled", count: promotions.filter(p => p.status === "scheduled").length, color: "text-primary" },
        { label: "Completed", count: promotions.filter(p => p.status === "completed").length, color: "text-muted-foreground" },
      ].map(stat => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl px-5 py-4"
        >
          <span className="text-subhead">{stat.label}</span>
          <div className={`text-3xl font-display font-bold mt-1 ${stat.color}`}>{stat.count}</div>
        </motion.div>
      ))}
    </div>

    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th className="text-left px-4 py-3 text-subhead font-medium">Promotion</th>
            <th className="text-left px-4 py-3 text-subhead font-medium">Category</th>
            <th className="text-left px-4 py-3 text-subhead font-medium">Period</th>
            <th className="text-right px-4 py-3 text-subhead font-medium">Sales Impact</th>
            <th className="text-right px-4 py-3 text-subhead font-medium">Revenue</th>
            <th className="text-center px-4 py-3 text-subhead font-medium">Forecast</th>
            <th className="text-center px-4 py-3 text-subhead font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {promotions.map(promo => {
            const config = statusConfig[promo.status];
            const Icon = config.icon;
            return (
              <tr key={promo.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-medium text-foreground">{promo.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{promo.category}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono-data text-[11px]">{promo.startDate} – {promo.endDate}</td>
                <td className="px-4 py-3 text-right font-mono-data text-success font-medium">{promo.impact}</td>
                <td className="px-4 py-3 text-right font-mono-data">{promo.revenue}</td>
                <td className="px-4 py-3 text-center">
                  {promo.forecastAdjusted ? (
                    <span className="text-[11px] text-success">✓ Adjusted</span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Pending</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${config.color}`}>
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </motion.div>
  </PageLayout>
  );
};

export default Promotions;
