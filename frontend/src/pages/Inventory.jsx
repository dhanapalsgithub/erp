import { useEffect, useState } from "react";
import { api, formatINR } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const emptyForm = {
  name: "",
  sku: "",
  price: "",
  stock: "",
  unit: "pcs",
  low_stock_threshold: 5,
  hsn: "",
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await api.get("/products");
    setProducts(data);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!form.name || !form.sku || form.price === "" || form.stock === "") {
      toast.error("Please fill Name, SKU, Price and Stock");
      return;
    }
    setSaving(true);
    try {
      await api.post("/products", {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
        low_stock_threshold: parseInt(form.low_stock_threshold, 10) || 5,
      });
      toast.success("Product added");
      setForm(emptyForm);
      setOpen(false);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to add product");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted");
      load();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const statusOf = (p) => {
    if (p.stock === 0) return { label: "Out of Stock", cls: "bg-red-100 text-red-700" };
    if (p.stock <= p.low_stock_threshold) return { label: "Low Stock", cls: "bg-amber-100 text-amber-700" };
    return { label: "Healthy", cls: "bg-emerald-100 text-emerald-700" };
  };

  return (
    <div className="space-y-6" data-testid="inventory-page">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-2xl font-semibold">Inventory</div>
          <div className="text-sm text-slate-500">Manage products & stock levels</div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="add-product-btn">
              <Plus className="h-4 w-4 mr-1" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Add Product</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Product Name</Label>
                <Input
                  data-testid="product-name-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label>SKU</Label>
                <Input
                  data-testid="product-sku-input"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
              <div>
                <Label>HSN Code</Label>
                <Input
                  value={form.hsn}
                  onChange={(e) => setForm({ ...form, hsn: e.target.value })}
                />
              </div>
              <div>
                <Label>Price (₹)</Label>
                <Input
                  data-testid="product-price-input"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div>
                <Label>Stock</Label>
                <Input
                  data-testid="product-stock-input"
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
              </div>
              <div>
                <Label>Low Stock Threshold</Label>
                <Input
                  type="number"
                  value={form.low_stock_threshold}
                  onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                data-testid="product-save-btn"
                onClick={submit}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? "Saving..." : "Save Product"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border border-slate-200">
        <CardContent className="p-0">
          <table className="w-full text-sm" data-testid="inventory-table">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-600">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">HSN</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-right">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const st = statusOf(p);
                return (
                  <tr key={p.id} className="border-b border-slate-100" data-testid={`product-row-${p.sku}`}>
                    <td className="py-3 px-4 font-medium">{p.name}</td>
                    <td className="py-3 px-4 text-slate-600">{p.sku}</td>
                    <td className="py-3 px-4 text-slate-600">{p.hsn || "-"}</td>
                    <td className="py-3 px-4 text-right tabular">{formatINR(p.price)}</td>
                    <td className="py-3 px-4 text-right tabular">
                      {p.stock} {p.unit}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`${st.cls} hover:${st.cls}`}>{st.label}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`product-delete-${p.sku}`}
                        onClick={() => remove(p.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-slate-500 py-8">
                    No products yet. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
