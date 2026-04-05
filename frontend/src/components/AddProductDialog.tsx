import { useState } from "react";
import { X } from "lucide-react";

interface AddProductDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (product: any) => void;
  categories?: string[];
}

const AddProductDialog = ({ open, onClose, onAdd, categories = [] }: AddProductDialogProps) => {
  const categoryOptions = categories.length ? categories : ["General"];
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: categoryOptions[0],
    price: "",
    stock: "",
    reorderPoint: "",
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: form.sku,
      name: form.name,
      category: form.category,
      price: parseFloat(form.price) || 0,
      forecast: 0,
      lastMonth: 0,
      change: 0,
      accuracy: 0,
      stock: parseInt(form.stock) || 0,
      reorderPoint: parseInt(form.reorderPoint) || 0,
    });
    setForm({ name: "", sku: "", category: categoryOptions[0], price: "", stock: "", reorderPoint: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-semibold text-foreground">Add New Product</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] text-muted-foreground block mb-1">Product Name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. Whole Milk 1gal" />
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground block mb-1">SKU *</label>
              <input required value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground font-mono placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. DAI-006" />
            </div>
          </div>
          <div>
            <label className="text-[12px] text-muted-foreground block mb-1">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
              {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[12px] text-muted-foreground block mb-1">Price ($)</label>
              <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0.00" />
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground block mb-1">Stock</label>
              <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0" />
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground block mb-1">Reorder Point</label>
              <input type="number" value={form.reorderPoint} onChange={e => setForm(f => ({ ...f, reorderPoint: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground rounded-lg border border-border">Cancel</button>
            <button type="submit" className="px-4 py-2 text-[13px] bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">Add Product</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductDialog;
