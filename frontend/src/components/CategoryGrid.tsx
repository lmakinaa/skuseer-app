import { motion } from "framer-motion";
import { useCategories } from "@/hooks/useApi";
import { LayoutGrid, ArrowUp, ArrowDown, Minus } from "lucide-react";

const trendIcon = { up: ArrowUp, down: ArrowDown, stable: Minus };
const trendColor = { up: "text-success", down: "text-destructive", stable: "text-muted-foreground" };

const CategoryGrid = () => {
  const { data: categories = [] } = useCategories();
  return (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.4 }}
    className="bg-card border border-border rounded-xl p-5"
  >
    <div className="flex items-center gap-2 mb-4">
      <LayoutGrid className="w-4 h-4 text-primary" />
      <span className="text-[13px] font-medium text-foreground">Category Performance</span>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
      {categories.map(cat => {
        const Icon = trendIcon[cat.trend];
        return (
          <div key={cat.name} className="bg-secondary/50 border border-border rounded-lg px-3.5 py-3 hover:border-primary/30 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] text-foreground font-medium">{cat.name}</span>
              <Icon className={`w-3 h-3 ${trendColor[cat.trend]}`} />
            </div>
            <div className="text-lg font-mono-data tracking-tighter text-foreground">{cat.accuracy}%</div>
            <span className="text-[10px] text-muted-foreground">{cat.products} products</span>
          </div>
        );
      })}
    </div>
  </motion.div>
  );
};

export default CategoryGrid;
