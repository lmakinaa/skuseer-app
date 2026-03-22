import { motion } from "framer-motion";
import { CheckCircle, XCircle, RefreshCw, ExternalLink } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { useIntegrations, useConnectIntegration, useRefreshIntegration } from "@/hooks/useApi";

// Emoji icons mapped by integration ID (not returned by API)
const INTEGRATION_ICONS: Record<string, string> = {
  weather: "🌦️",
  holidays: "📅",
  pos: "🏪",
  promotions: "🏷️",
  supplier: "🚚",
  competitor: "📊",
};

const Settings = () => {
  const { data: integrations = [] } = useIntegrations();
  const connect = useConnectIntegration();
  const refresh = useRefreshIntegration();

  return (
  <PageLayout title="Settings" subtitle="Data sources & integrations">
    <div className="bg-card border border-border rounded-xl p-5 mb-2">
      <h3 className="text-[14px] font-display font-semibold text-foreground mb-1">AI Data Sources</h3>
      <p className="text-[12px] text-muted-foreground">
        StockSeer connects to external data sources to improve forecast accuracy. Each integration feeds real-world signals into the AI models.
      </p>
    </div>

    <div className="space-y-3">
      {integrations.map((integration, i) => (
        <motion.div
          key={integration.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className={`bg-card border rounded-xl p-5 ${
            integration.status === "connected" ? "border-border" : "border-dashed border-border"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0">
              {INTEGRATION_ICONS[integration.id] ?? "🔌"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-[14px] font-medium text-foreground">{integration.name}</h4>
                {integration.status === "connected" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    <XCircle className="w-3 h-3" /> Not Connected
                  </span>
                )}
              </div>
              <p className="text-[12px] text-muted-foreground mb-3">{integration.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                <div>
                  <span className="text-subhead block mb-1">Provider</span>
                  <span className="text-foreground">{integration.provider}</span>
                </div>
                <div>
                  <span className="text-subhead block mb-1">Data Points</span>
                  <span className="text-foreground">{integration.dataPoints}</span>
                </div>
                <div>
                  <span className="text-subhead block mb-1">Impact</span>
                  <span className={integration.status === "connected" ? "text-success" : "text-muted-foreground"}>{integration.impact}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              {integration.status === "connected" ? (
                <>
                  <div className="text-[10px] text-muted-foreground text-right">
                    Last sync: {integration.lastSync}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => refresh.mutate(integration.id)}
                      disabled={refresh.isPending}
                      className="p-1.5 rounded-md border border-border hover:bg-accent transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${refresh.isPending ? "animate-spin" : ""}`} />
                    </button>
                    <button className="p-1.5 rounded-md border border-border hover:bg-accent transition-colors">
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => connect.mutate(integration.id)}
                  disabled={connect.isPending}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-[12px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {connect.isPending ? "Connecting..." : "Connect"}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </PageLayout>
  );
};

export default Settings;
