import { motion } from "framer-motion";
import { useTopProducts } from "@/hooks/useApi";
import { ArrowUp, ArrowDown, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TopProducts = () => {
  const navigate = useNavigate();
  const { data: products = [] } = useTopProducts();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="bg-card border border-border rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary" />
          <span className="text-[13px] font-medium text-foreground">Top Products — Next 30 Days</span>
        </div>
        <button onClick={() => navigate("/products")} className="text-[11px] text-primary hover:underline">View all →</button>
      </div>
      <div className="space-y-2.5">
        {products.map((p, i) => (
          <div
            key={i}
            onClick={() => navigate(`/products/${p.sku}`)}
            className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0 cursor-pointer hover:bg-accent/50 -mx-2 px-2 rounded-md transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground font-mono-data w-16">{p.sku}</span>
              <span className="text-[12px] text-foreground">{p.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-foreground font-mono-data">{p.forecast}</span>
              <span className={`flex items-center gap-0.5 text-[11px] font-mono-data ${p.positive ? "text-success" : "text-destructive"}`}>
                {p.positive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {p.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default TopProducts;
