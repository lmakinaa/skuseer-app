import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUp, ArrowDown, TrendingUp, Package, DollarSign, Target, AlertTriangle, Play, Clock, History } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import { useProduct, useProductSalesHistory, useForecastRuns, useCreateForecastRun, useDeleteProduct } from "@/hooks/useApi";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: apiDetail } = useProduct(id ?? "");
  const { data: salesHistory = [] } = useProductSalesHistory(id ?? "");
  const { data: forecastHistory = [] } = useForecastRuns(id);
  const createRun = useCreateForecastRun();
  const deleteProduct = useDeleteProduct();
  const [activeTab, setActiveTab] = useState<"overview" | "sales" | "forecasts">("overview");

  const product = apiDetail?.product;

  if (!product) {
    return (
      <PageLayout title="Product Not Found">
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Product not found</p>
          <button onClick={() => navigate("/products")} className="text-primary hover:underline text-sm">← Back to Products</button>
        </div>
      </PageLayout>
    );
  }

  const chartData = apiDetail?.chartData ?? [];
  const insights = apiDetail?.insights ?? [];
  const daysUntilReorder = Math.max(0, Math.round((product.stock - product.reorderPoint) / (product.forecast / 30)));
  const monthlyRevenue = product.price * product.forecast;
  const isLowStock = product.stock <= product.reorderPoint * 1.2;

  const kpis = [
    { label: "30-Day Forecast", value: `${product.forecast.toLocaleString()} units`, icon: TrendingUp, detail: `${product.change >= 0 ? "+" : ""}${product.change}% vs last month` },
    { label: "Projected Revenue", value: `$${(monthlyRevenue / 1000).toFixed(1)}K`, icon: DollarSign, detail: `@ $${product.price.toFixed(2)} per unit` },
    { label: "Forecast Accuracy", value: `${product.accuracy}%`, icon: Target, detail: "30-day rolling average" },
    { label: "Current Stock", value: `${product.stock} units`, icon: Package, detail: `${daysUntilReorder} days until reorder` },
  ];

  const tabs = [
    { key: "overview" as const, label: "Overview", icon: TrendingUp },
    { key: "sales" as const, label: "Sales History", icon: History },
    { key: "forecasts" as const, label: "Forecast History", icon: Clock },
  ];

  const handleRunForecast = () => {
    createRun.mutate({
      name: `${product.name} Forecast`,
      model: "Smart Forecast",
      productIds: [product.id],
    });
  };

  const handleDeleteProduct = () => {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    deleteProduct.mutate(product.id, {
      onSuccess: () => navigate("/products"),
    });
  };

  return (
    <PageLayout title={product.name} subtitle={product.id}>
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/products")}
          className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handleDeleteProduct}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] border border-destructive/30 text-destructive font-medium hover:bg-destructive/10">
            Delete Product
          </button>
          <button onClick={handleRunForecast}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] bg-primary text-primary-foreground font-medium hover:bg-primary/90">
            <Play className="w-3.5 h-3.5" /> Run Forecast
          </button>
        </div>
      </div>

      {/* Low stock alert */}
      {isLowStock && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
          <div>
            <span className="text-[13px] font-medium text-foreground">Low Stock Alert</span>
            <span className="text-[12px] text-muted-foreground ml-2">
              Current stock ({product.stock} units) is near reorder point ({product.reorderPoint} units). Estimated {daysUntilReorder} days until reorder needed.
            </span>
          </div>
        </motion.div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card border border-border rounded-xl px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-subhead">{kpi.label}</span>
              <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center">
                <kpi.icon className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
            <div className="text-xl font-display font-bold tracking-tight text-foreground">{kpi.value}</div>
            <span className="text-[11px] text-muted-foreground mt-1 block">{kpi.detail}</span>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] transition-colors ${
              activeTab === tab.key ? "bg-card text-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <>
          {/* Forecast chart */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-[13px] font-medium text-foreground">Sales History & Forecast</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="productForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(217, 72%, 50%)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(217, 72%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(220, 10%, 46%)" }} tickLine={false} interval={6} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(220, 10%, 46%)" }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="actual" stroke="hsl(220, 20%, 50%)" strokeWidth={1.5} fill="none" dot={false} />
                <Area type="monotone" dataKey="forecast" stroke="hsl(217, 72%, 50%)" strokeWidth={2} fill="url(#productForecast)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Product info row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-card border border-border rounded-xl p-5">
              <span className="text-[13px] font-medium text-foreground block mb-4">Product Details</span>
              <div className="space-y-3 text-[13px]">
                {[
                  ["SKU", product.id],
                  ["Category", product.category],
                  ["Unit Price", `$${product.price.toFixed(2)}`],
                  ["Reorder Point", `${product.reorderPoint} units`],
                  ["Last Month Sales", `${product.lastMonth.toLocaleString()} units`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-foreground font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="bg-card border border-border rounded-xl p-5">
              <span className="text-[13px] font-medium text-foreground block mb-4">AI Insights</span>
              <div className="space-y-3">
                {insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      insight.type === "success" ? "bg-success" : insight.type === "warning" ? "bg-warning" : "bg-primary"
                    }`} />
                    <span className="text-[12px] text-foreground leading-relaxed">{insight.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}

      {activeTab === "sales" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <History className="w-4 h-4 text-primary" />
            <span className="text-[13px] font-medium text-foreground">Daily Sales — Last 90 Days</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesHistory} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217, 72%, 50%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(217, 72%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(220, 10%, 46%)" }} tickLine={false} interval={6} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(220, 10%, 46%)" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 13%, 91%)", borderRadius: "8px", fontSize: "12px" }} />
              <Area type="monotone" dataKey="sales" stroke="hsl(217, 72%, 50%)" strokeWidth={1.5} fill="url(#salesGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>

          {/* Sales summary table */}
          <div className="mt-5 grid grid-cols-4 gap-3">
            {[
              { label: "Total (90d)", value: salesHistory.reduce((s, d) => s + d.sales, 0).toLocaleString() },
              { label: "Daily Average", value: Math.round(salesHistory.reduce((s, d) => s + d.sales, 0) / 90).toLocaleString() },
              { label: "Peak Day", value: Math.max(...salesHistory.map(d => d.sales)).toLocaleString() },
              { label: "Low Day", value: Math.min(...salesHistory.map(d => d.sales)).toLocaleString() },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-[11px] text-muted-foreground">{stat.label}</div>
                <div className="text-[15px] font-semibold text-foreground">{stat.value}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === "forecasts" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-[13px] font-medium text-foreground">Forecast Run History</span>
            </div>
            <button onClick={handleRunForecast}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] bg-primary text-primary-foreground font-medium hover:bg-primary/90">
              <Play className="w-3 h-3" /> New Forecast
            </button>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 text-subhead font-medium">Run ID</th>
                <th className="text-left px-4 py-3 text-subhead font-medium">Date</th>
                <th className="text-left px-4 py-3 text-subhead font-medium">Model</th>
                <th className="text-right px-4 py-3 text-subhead font-medium">Forecast</th>
                <th className="text-right px-4 py-3 text-subhead font-medium">Accuracy</th>
                <th className="text-right px-4 py-3 text-subhead font-medium">Duration</th>
                <th className="text-right px-4 py-3 text-subhead font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {forecastHistory.map((fc: any) => (
                <tr key={fc.id} className="border-b border-border/50 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/forecasts/${fc.id}`)}>
                  <td className="px-4 py-3 font-mono text-muted-foreground text-[11px]">{fc.id}</td>
                  <td className="px-4 py-3 text-foreground">{fc.date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fc.model}</td>
                  <td className="px-4 py-3 text-right font-mono">{(fc.products ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono">{fc.accuracy ? `${fc.accuracy}%` : "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{fc.duration}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${fc.status === "completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                      {fc.status === "completed" ? "Completed" : fc.status === "running" ? "Running" : "Failed"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </PageLayout>
  );
};

export default ProductDetail;
