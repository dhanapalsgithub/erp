import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sheets, formatINR } from "@/lib/sheets";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const emptyLine = { product_id: "", quantity: 1, price: "" };

export default function NewBill() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [cgstRate, setCgstRate] = useState(9);
  const [sgstRate, setSgstRate] = useState(9);
  const [discount, setDiscount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stocks = await sheets.stock();
        setProducts(stocks);
      } catch (e) {
        toast.error("Cannot load stock: " + e.message);
      }
    })();
  }, []);

  const productById = useMemo(() => {
    const m = {};
    for (const p of products) m[p.product_id] = p;
    return m;
  }, [products]);

  const addLine = () => setLines([...lines, { ...emptyLine }]);
  const removeLine = (i) => setLines(lines.filter((_, idx) => idx !== i));
  const updateLine = (i, patch) =>
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const enriched = lines.map((l) => {
    const p = productById[l.product_id];
    const price = Number(l.price || 0);
    return {
      ...l,
      product: p,
      price,
      lineTotal: price * (Number(l.quantity) || 0),
      stockAvailable: p?.stock ?? 0,
      overstock: p ? Number(l.quantity) > p.stock : false,
    };
  });

  const subtotal = enriched.reduce((s, l) => s + l.lineTotal, 0);
  const taxable = Math.max(subtotal - Number(discount || 0), 0);
  const cgstAmount = (taxable * Number(cgstRate || 0)) / 100;
  const sgstAmount = (taxable * Number(sgstRate || 0)) / 100;
  const grandTotal = taxable + cgstAmount + sgstAmount;

  const hasOverstock = enriched.some((l) => l.overstock);
  const hasEmpty = enriched.some(
    (l) => !l.product_id || !(Number(l.quantity) > 0) || !(Number(l.price) > 0)
  );

  const submit = async () => {
    if (!customerName) return toast.error("Customer name is required");
    if (hasEmpty) return toast.error("Each line needs product, quantity > 0 and price > 0");
    if (hasOverstock) return toast.error("Some items exceed available stock");

    setSaving(true);
    try {
      const payload = {
        customer_name: customerName,
        customer_gstin: customerGstin,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        items: enriched.map((l) => ({
          product_id: l.product.product_id,
          product_name: l.product.product_name,
          hsn: "",
          price: l.price,
          quantity: Number(l.quantity),
          unit: l.product.unit || "KGS",
        })),
        cgst_rate: Number(cgstRate),
        sgst_rate: Number(sgstRate),
        discount: Number(discount) || 0,
        payment_status: paymentStatus,
        notes,
      };
      const inv = await sheets.createInvoice(payload);
      toast.success(`Invoice ${inv.invoice_no} created`);
      window.open(`/invoices/${inv.id}/print`, "_blank");
      navigate("/billing");
    } catch (e) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="new-bill-page">
      <div>
        <div className="text-orange-600 text-xs uppercase tracking-widest font-semibold">Overview</div>
        <h1 className="font-display text-3xl font-semibold">New Bill</h1>
        <p className="text-slate-600 mt-1 text-sm">
          GST invoice with live total summary. On save, stock is deducted via a Sale transaction in
          the Inventory sheet.
        </p>
      </div>

      {hasOverstock && (
        <div
          className="flex items-start gap-2 border border-red-200 bg-red-50 text-red-800 rounded-md px-4 py-3"
          data-testid="overstock-warning"
        >
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div className="text-sm">One or more line items exceed available inventory.</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border border-slate-200">
            <CardContent className="p-5">
              <div className="font-display font-semibold text-lg mb-4">Customer</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    data-testid="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </div>
                <div>
                  <Label>GSTIN</Label>
                  <Input value={customerGstin} onChange={(e) => setCustomerGstin(e.target.value)} />
                </div>
                <div>
                  <Label>Payment Status</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Address</Label>
                  <Textarea value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-display font-semibold text-lg">Line Items</div>
                <Button variant="outline" size="sm" onClick={addLine} data-testid="add-line-btn">
                  <Plus className="h-4 w-4 mr-1" /> Add Row
                </Button>
              </div>

              {products.length === 0 ? (
                <div className="text-sm text-slate-500 border border-dashed border-slate-300 rounded-md p-4 text-center">
                  No products found in the Inventory sheet. Go to Inventory → Add New → create an
                  "Opening Stock" entry for each product first.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="line-items-table">
                    <thead>
                      <tr className="text-left text-slate-500 uppercase text-[11px] tracking-wider border-b border-slate-200">
                        <th className="py-2">Product</th>
                        <th className="py-2 text-right">Price (₹)</th>
                        <th className="py-2 text-right">Qty</th>
                        <th className="py-2 text-right">Stock</th>
                        <th className="py-2 text-right">Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {enriched.map((l, i) => (
                        <tr key={i} className="border-b border-slate-100" data-testid={`line-row-${i}`}>
                          <td className="py-2 pr-2 min-w-[220px]">
                            <Select
                              value={l.product_id}
                              onValueChange={(v) => updateLine(i, { product_id: v })}
                            >
                              <SelectTrigger data-testid={`line-product-${i}`}>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((p) => (
                                  <SelectItem key={p.product_id} value={p.product_id}>
                                    {p.product_name} ({p.product_id}) • {p.stock} {p.unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-2 text-right">
                            <Input
                              type="number"
                              className="w-28 text-right tabular"
                              value={l.price}
                              onChange={(e) => updateLine(i, { price: e.target.value })}
                              data-testid={`line-price-${i}`}
                            />
                          </td>
                          <td className="py-2 text-right">
                            <Input
                              type="number"
                              className="w-24 text-right tabular"
                              min={1}
                              value={l.quantity}
                              onChange={(e) => updateLine(i, { quantity: e.target.value })}
                              data-testid={`line-qty-${i}`}
                            />
                          </td>
                          <td className="py-2 text-right tabular">
                            <span
                              className={
                                l.overstock
                                  ? "text-red-600 font-semibold"
                                  : l.product && l.stockAvailable <= 10
                                  ? "text-amber-600"
                                  : "text-slate-600"
                              }
                            >
                              {l.product ? `${l.stockAvailable} ${l.product.unit || ""}` : "-"}
                            </span>
                          </td>
                          <td className="py-2 text-right tabular font-medium">
                            {formatINR(l.lineTotal)}
                          </td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLine(i)}
                              disabled={lines.length === 1}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-slate-200">
            <CardContent className="p-5">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional invoice notes / terms" />
            </CardContent>
          </Card>
        </div>

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
                    data-testid="summary-discount"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">CGST %</span>
                  <Input
                    type="number"
                    className="w-24 text-right tabular"
                    value={cgstRate}
                    onChange={(e) => setCgstRate(e.target.value)}
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
                  <span className="tabular font-display font-bold text-xl text-orange-600" data-testid="summary-grand-total">
                    {formatINR(grandTotal)}
                  </span>
                </div>
              </div>

              <Button
                onClick={submit}
                disabled={saving || hasOverstock}
                data-testid="save-bill-btn"
                className="w-full mt-5 bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? "Saving..." : "Save & Print Bill"}
              </Button>

              <div className="text-xs text-slate-500 mt-3 text-center">
                Saves invoice to Billing sheet and posts Sale transactions to Inventory sheet.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
