import { motion } from "framer-motion";
import { FileText, Download, CheckCircle, Clock, Loader2 } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { useReports, useGenerateReport } from "@/hooks/useApi";

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  delivered: { icon: CheckCircle, color: "text-success", label: "Delivered" },
  scheduled: { icon: Clock, color: "text-primary", label: "Scheduled" },
  generating: { icon: Loader2, color: "text-warning", label: "Generating" },
};

const Reports = () => {
  const { data: reports = [] } = useReports();
  const generateReport = useGenerateReport();

  const handleGenerate = () => {
    generateReport.mutate({
      name: "Ad-hoc Report",
      type: "Performance",
      recipients: "team@freshmart.com",
    });
  };
  return (
  <PageLayout title="Reports" subtitle="Automated insights & analytics">
    <div className="flex items-center gap-3">
      <button
        onClick={handleGenerate}
        disabled={generateReport.isPending}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {generateReport.isPending ? "Generating..." : "+ Generate Report"}
      </button>
      <button className="bg-card border border-border text-foreground px-4 py-2 rounded-lg text-[13px] hover:bg-accent transition-colors">
        Schedule Report
      </button>
    </div>

    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {reports.map((report, i) => {
        const config = statusConfig[report.status];
        const Icon = config.icon;
        return (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/20 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-foreground">{report.name}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {report.type} · {report.date} · {report.recipients}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1 text-[11px] ${config.color}`}>
                <Icon className={`w-3 h-3 ${report.status === "generating" ? "animate-spin" : ""}`} />
                {config.label}
              </span>
              {report.status === "delivered" && (
                <button className="p-1.5 rounded-md hover:bg-accent transition-colors">
                  <Download className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  </PageLayout>
  );
};

export default Reports;
