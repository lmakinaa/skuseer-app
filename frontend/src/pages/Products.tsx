import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ArrowUp, ArrowDown, Filter } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { useProducts, useCategories } from "@/hooks/useApi";

const Products = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: productData } = useProducts(search, selectedCategory);
  const { data: categories = [] } = useCategories();

  const items = productData?.items ?? [];
  const total = productData?.total ?? 0;
  const categoryList = ["All", ...categories.map(c => c.name)];

  return (
    <PageLayout title="Products" subtitle={`${total.toLocaleString()} active products`}>
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          {categoryList.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[12px] transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-4 py-3 text-subhead font-medium">SKU</th>
              <th className="text-left px-4 py-3 text-subhead font-medium">Product Name</th>
              <th className="text-left px-4 py-3 text-subhead font-medium">Category</th>
              <th className="text-right px-4 py-3 text-subhead font-medium">Price</th>
              <th className="text-right px-4 py-3 text-subhead font-medium">30-Day Forecast</th>
              <th className="text-right px-4 py-3 text-subhead font-medium">Change</th>
              <th className="text-right px-4 py-3 text-subhead font-medium">Accuracy</th>
              <th className="text-right px-4 py-3 text-subhead font-medium">Stock</th>
            </tr>
          </thead>
          <tbody>
            {items.map(p => (
              <tr
                key={p.id}
                onClick={() => navigate(`/products/${p.id}`)}
                className="border-b border-border/50 hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 font-mono-data text-muted-foreground text-[11px]">{p.id}</td>
                <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                <td className="px-4 py-3 text-right font-mono-data">${p.price.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-mono-data">{p.forecast.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`inline-flex items-center gap-0.5 font-mono-data text-[12px] ${p.change >= 0 ? "text-success" : "text-destructive"}`}>
                    {p.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {Math.abs(p.change)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono-data">{p.accuracy}%</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-mono-data ${p.stock <= p.reorderPoint ? "text-destructive font-medium" : "text-foreground"}`}>
                    {p.stock}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </PageLayout>
  );
};

export default Products;
