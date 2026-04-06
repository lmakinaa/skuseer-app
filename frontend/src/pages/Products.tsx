import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ArrowUp, ArrowDown, Filter, Plus, Play, CheckSquare, Trash2, Upload } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import AddProductDialog from "@/components/AddProductDialog";
import { useProducts, useCategories, useCreateProduct, useCreateForecastRun, useDeleteProduct, useImportSalesCsv } from "@/hooks/useApi";

const Products = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  const { data: apiProductsData } = useProducts(search, selectedCategory);
  const { data: apiCategories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const createRun = useCreateForecastRun();
  const deleteProduct = useDeleteProduct();
  const importSales = useImportSalesCsv();
  const salesFileRef = useRef<HTMLInputElement>(null);

  const products = apiProductsData?.items ?? [];

  const filtered = products;

  const categories = ["All", ...apiCategories.map(c => c.name)];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  const handleRunForecast = (scope: "selected" | "all") => {
    const ids = scope === "all" ? products.map(p => p.id) : Array.from(selectedIds);
    createRun.mutate({
      name: scope === "all" ? "Full Catalog Forecast" : "Selected Products Forecast",
      model: "Smart Forecast",
      productIds: scope === "all" ? [] : ids,
    });
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} selected product${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) return;

    await Promise.all(ids.map((productId) => deleteProduct.mutateAsync(productId)));
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const handleAddProduct = (product: any) => {
    createProduct.mutate({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      reorderPoint: product.reorderPoint,
    });
  };

  const handleSalesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importSales.mutate(file);
    e.target.value = "";
  };

  return (
    <PageLayout title="Products" subtitle={`${products.length} active products`}>
      {/* Action bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setSelectionMode(m => { if (m) setSelectedIds(new Set()); return !m; })}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] border transition-colors ${selectionMode ? "bg-primary/10 border-primary/30 text-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}>
            <CheckSquare className="w-3.5 h-3.5" /> Select
          </button>
          {selectionMode && selectedIds.size > 0 && (
            <button onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete ({selectedIds.size})
            </button>
          )}
          {selectionMode && selectedIds.size > 0 && (
            <button onClick={() => handleRunForecast("selected")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] bg-primary text-primary-foreground font-medium hover:bg-primary/90">
              <Play className="w-3.5 h-3.5" /> Forecast ({selectedIds.size})
            </button>
          )}
          <button onClick={() => handleRunForecast("all")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Play className="w-3.5 h-3.5" /> Forecast All
          </button>
          <input ref={salesFileRef} type="file" accept=".csv" className="hidden" onChange={handleSalesFileChange} />
          <button onClick={() => salesFileRef.current?.click()}
            disabled={importSales.isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50">
            <Upload className="w-3.5 h-3.5" /> {importSales.isPending ? "Importing..." : "Import Sales Data"}
          </button>
          <button onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] bg-primary text-primary-foreground font-medium hover:bg-primary/90">
            <Plus className="w-3.5 h-3.5" /> Add Product
          </button>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-[12px] transition-colors ${selectedCategory === cat
              ? "bg-primary text-primary-foreground font-medium"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              {selectionMode && (
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll} className="rounded border-border" />
                </th>
              )}
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
            {filtered.map(p => (
              <tr key={p.id}
                onClick={() => !selectionMode && navigate(`/products/${p.id}`)}
                className="border-b border-border/50 hover:bg-accent/50 cursor-pointer transition-colors">
                {selectionMode && (
                  <td className="px-4 py-3" onClick={e => { e.stopPropagation(); toggleSelect(p.id); }}>
                    <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded border-border" />
                  </td>
                )}
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

      <AddProductDialog open={showAddDialog} onClose={() => setShowAddDialog(false)} onAdd={handleAddProduct} categories={categories.filter(c => c !== "All")} />
    </PageLayout>
  );
};

export default Products;
