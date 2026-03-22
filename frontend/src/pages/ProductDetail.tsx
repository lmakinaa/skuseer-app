import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUp, ArrowDown, TrendingUp, Package, DollarSign, Target, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import PageLayout from "@/components/PageLayout";
import { useProduct } from "@/hooks/useApi";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useProduct(id ?? "");

  if (isLoading) {
    return (
      <PageLayout title="Loading...">
        <div className="text-center py-20 text-muted-foreground text-[13px]">Loading product...</div>
      </PageLayout>
    );
  }

  if (isError || !data) {
    return (
      <PageLayout title="Product Not Found">
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Product not found</p>
          <button onClick={() => navigate("/products")} className="text-primary hover:underline text-sm">← Back to Products</button>
        </div>
      </PageLayout>
    );
  }

  const { product, chartData, insights } = data;
  const daysUntilReorder = Math.max(0, Math.round((product.stock - product.reorderPoint) / (product.forecast / 30)));
  const monthlyRevenue = product.price * product.forecast;
  const isLowStock = product.stock <= product.reorderPoint * 1.2;

  const kpis = [
    { label: "30-Day Forecast", value: `${product.forecast.toLocaleString()} units`, icon: TrendingUp, detail: `${product.change >= 0 ? "+" : ""}${product.change}% vs last month` },
    { label: "Projected Revenue", value: `$${(monthlyRevenue / 1000).toFixed(1)}K`, icon: DollarSign, detail: `@ $${product.price.toFixed(2)} per unit` },
    { label: "Forecast Accuracy", value: `${product.accuracy}%`, icon: Target, detail: "30-day rolling average" },
    { label: "Current Stock", value: `${product.stock} units`, icon: Package, detail: `${daysUntilReorder} days until reorder` },
  ];

  const typeColor = { success: "bg-success", warning: "bg-warning", info: "bg-primary" };

  return (
    <PageLayout title={product.name} subtitle={product.id}>
      {/* Back button */}
      <button
        onClick={() => navigate("/products")}
        className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
      </button>

      {/* Low stock alert */}
      {isLowStock && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 flex items-center gap-3"
        >
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
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card border border-border rounded-xl px-5 py-4"
          >
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

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-xl p-5"
      >
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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-5"
        >
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

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <span className="text-[13px] font-medium text-foreground block mb-4">AI Insights</span>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${typeColor[insight.type as keyof typeof typeColor] ?? "bg-primary"}`} />
                <span className="text-[12px] text-foreground leading-relaxed">{insight.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default ProductDetail;
