import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatINR } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const emptyLine = { product_id: "", quantity: 1 };

export default function NewBill() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [cgstRate, setCgstRate] = useState(9);
  const [sgstRate, setSgstRate] = useState(9);
  const [discount, setDiscount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [c, p] = await Promise.all([api.get("/customers"), api.get("/products")]);
      setCustomers(c.data);
      setProducts(p.data);
    })();
  }, []);

  const productById = useMemo(() => {
    const m = {};
    for (const p of products) m[p.id] = p;
    return m;
  }, [products]);

  const addLine = () => setLines([...lines, { ...emptyLine }]);
  const removeLine = (idx) => setLines(lines.filter((_, i) => i !== idx));
  const updateLine = (idx, patch) => {
    setLines(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const enrichedLines = lines.map((l) => {
    const p = productById[l.product_id];
    return {
      ...l,
      product: p,
      price: p?.price || 0,
      lineTotal: (p?.price || 0) * (Number(l.quantity) || 0),
      stockAvailable: p?.stock ?? 0,
      overstock: p ? Number(l.quantity) > p.stock : false,
    };
  });

  const subtotal = enrichedLines.reduce((s, l) => s + l.lineTotal, 0);
  const taxable = Math.max(subtotal - Number(discount || 0), 0);
  const cgstAmount = (taxable * Number(cgstRate || 0)) / 100;
  const sgstAmount = (taxable * Number(sgstRate || 0)) / 100;
  const grandTotal = taxable + cgstAmount + sgstAmount;

  const hasOverstock = enrichedLines.some((l) => l.overstock);
  const hasEmpty = enrichedLines.some((l) => !l.product_id || !(Number(l.quantity) > 0));

  const submit = async () => {
    if (!customerId) return toast.error("Select a customer");
    if (lines.length === 0 || hasEmpty)
      return toast.error("Add at least one product with quantity > 0");
    if (hasOverstock) return toast.error("Some items exceed available stock");

    setSaving(true);
    try {
      const payload = {
        customer_id: customerId,
        items: enrichedLines.map((l) => ({
          product_id: l.product_id,
          name: l.product.name,
          sku: l.product.sku,
          hsn: l.product.hsn || "",
          price: l.product.price,
          quantity: Number(l.quantity),
          unit: l.product.unit,
        })),
        cgst_rate: Number(cgstRate),
        sgst_rate: Number(sgstRate),
        discount: Number(discount) || 0,
        payment_status: paymentStatus,
        notes,
      };
      const { data } = await api.post("/invoices", payload);
      toast.success(`Invoice ${data.invoice_no} created. Stock deducted.`);
      window.open(`/invoices/${data.id}/print`, "_blank");
      navigate("/billing");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to save invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="new-bill-page">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-2xl font-semibold">New Bill</div>
          <div className="text-sm text-slate-500">Create GST invoice with auto stock deduction</div>
        </div>
      </div>

      {hasOverstock && (
        <div
          className="flex items-start gap-2 border border-red-200 bg-red-50 text-red-800 rounded-md px-4 py-3"
          data-testid="overstock-warning"
        >
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div className="text-sm">
            One or more line items exceed available inventory. Adjust quantities before saving.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left – form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border border-slate-200">
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Customer</Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger data-testid="customer-select">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id} data-testid={`customer-option-${c.name}`}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment Status</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger data-testid="payment-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-display font-semibold text-lg">Line Items</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addLine}
                  data-testid="add-line-btn"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Row
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="line-items-table">
                  <thead>
                    <tr className="text-left text-slate-600 border-b border-slate-200">
                      <th className="py-2">Product</th>
                      <th className="py-2 text-right">Price</th>
                      <th className="py-2 text-right">Qty</th>
                      <th className="py-2 text-right">Stock</th>
                      <th className="py-2 text-right">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedLines.map((l, idx) => (
                      <tr key={idx} className="border-b border-slate-100" data-testid={`line-row-${idx}`}>
                        <td className="py-2 pr-2 min-w-[200px]">
                          <Select
                            value={l.product_id}
                            onValueChange={(v) => updateLine(idx, { product_id: v })}
                          >
                            <SelectTrigger data-testid={`line-product-select-${idx}`}>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} ({p.sku})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 text-right tabular">
                          {l.product ? formatINR(l.price) : "-"}
                        </td>
                        <td className="py-2 text-right">
                          <Input
                            type="number"
                            className="w-24 text-right tabular"
                            min={1}
                            data-testid={`line-qty-input-${idx}`}
                            value={l.quantity}
                            onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                          />
                        </td>
                        <td className="py-2 text-right tabular">
                          <span
                            className={
                              l.overstock
                                ? "text-red-600 font-semibold"
                                : l.product && l.stockAvailable <= (l.product.low_stock_threshold ?? 5)
                                ? "text-amber-600"
                                : "text-slate-600"
                            }
                          >
                            {l.product ? `${l.stockAvailable} ${l.product.unit}` : "-"}
                          </span>
                        </td>
                        <td className="py-2 text-right tabular font-medium">
                          {formatINR(l.lineTotal)}
                        </td>
                        <td className="py-2 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLine(idx)}
                            disabled={lines.length === 1}
                            data-testid={`line-remove-btn-${idx}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-slate-200">
            <CardContent className="p-5">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional invoice notes / terms"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right – total summary */}
        <div>
          <Card className="shadow-sm border border-slate-200 sticky top-4" data-testid="total-summary-card">
            <CardContent className="p-5">
              <div className="font-display text-lg font-semibold mb-4">Total Summary</div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="tabular font-medium" data-testid="summary-subtotal">
                    {formatINR(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">Discount (₹)</span>
                  <Input
                    type="number"
                    className="w-28 text-right tabular"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    data-testid="summary-discount-input"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">CGST %</span>
                  <Input
                    type="number"
                    className="w-24 text-right tabular"
                    value={cgstRate}
                    onChange={(e) => setCgstRate(e.target.value)}
                    data-testid="summary-cgst-input"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">CGST Amount</span>
                  <span className="tabular text-xs" data-testid="summary-cgst-amount">
                    {formatINR(cgstAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">SGST %</span>
                  <Input
                    type="number"
                    className="w-24 text-right tabular"
                    value={sgstRate}
                    onChange={(e) => setSgstRate(e.target.value)}
                    data-testid="summary-sgst-input"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">SGST Amount</span>
                  <span className="tabular text-xs" data-testid="summary-sgst-amount">
                    {formatINR(sgstAmount)}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                  <span className="font-display font-semibold">Grand Total</span>
                  <span className="tabular font-display font-bold text-xl text-blue-700" data-testid="summary-grand-total">
                    {formatINR(grandTotal)}
                  </span>
                </div>
              </div>

              <Button
                onClick={submit}
                disabled={saving || hasOverstock}
                data-testid="save-bill-btn"
                className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? "Saving..." : "Save & Print Bill"}
              </Button>

              <div className="text-xs text-slate-500 mt-3 text-center">
                Saving will auto-deduct stock from inventory and open the 3-copy print view.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
