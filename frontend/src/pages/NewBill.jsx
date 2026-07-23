import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sheets, formatINR } from "@/lib/sheets";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const emptyLine = { product_id: "", quantity: 1, price: "", hsn: "" };

export default function NewBill() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [existingInvoices, setExistingInvoices] = useState([]); // Track existing bills for numbering
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
        // Fetch Billing list to calculate dynamic invoice numbers
        const [stocks, custs, bills] = await Promise.all([
          sheets.stock(), 
          sheets.list("Customers"), 
          sheets.list("Billing")
        ]);
        setProducts(Array.isArray(stocks) ? stocks : []);
        setCustomers(Array.isArray(custs) ? custs : []);
        setExistingInvoices(Array.isArray(bills) ? bills : []);
      } catch (e) {
        toast.error("Error loading data: " + e.message);
      }
    })();
  }, []);

  const handleCustomerSelect = (name) => {
    setCustomerName(name);
    const selected = customers.find((c) => c.customer_name === name);
    if (selected) {
      setCustomerAddress(selected.address || "");
      setCustomerGstin(selected.gstin || "");
      setCustomerPhone(selected.phone || "");
    }
  };

  const productById = useMemo(() => {
    const m = {};
    (products || []).forEach((p) => {
      if (p && p.product_id) m[p.product_id] = p;
    });
    return m;
  }, [products]);

  const addLine = () => setLines([...lines, { ...emptyLine }]);
  const removeLine = (i) => setLines(lines.filter((_, idx) => idx !== i));

  const updateLine = (i, patch) => {
    if (patch.product_id) {
      const p = productById[patch.product_id];
      patch.price = p?.price || "";
      patch.hsn = p?.hsn || "";
    }
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };

  const enriched = lines.map((l) => {
    const p = productById[l.product_id];
    const price = Number(l.price || 0);
    const qty = Number(l.quantity || 0);
    const currentStock = p ? Number(p.closing_stock || p.opening_stock || 0) : 0;
    const isOverstock = p ? (qty > currentStock) : false;

    return {
      ...l,
      product: p,
      price,
      lineTotal: price * qty,
      stockAvailable: currentStock,
      overstock: isOverstock,
    };
  });

  const subtotal = enriched.reduce((s, l) => s + l.lineTotal, 0);
  const taxable = Math.max(subtotal - Number(discount || 0), 0);
  const cgstAmount = (taxable * Number(cgstRate || 0)) / 100;
  const sgstAmount = (taxable * Number(sgstRate || 0)) / 100;
  const grandTotal = taxable + cgstAmount + sgstAmount;

  const hasEmpty = enriched.some((l) => !l.product_id || !(Number(l.quantity) > 0) || !(Number(l.price) > 0));

  const printLabels = (items, invoiceNo, customer) => {
    const win = window.open("", "_blank");
    if (!win) return toast.error("Please allow popups to print labels.");
    let html = `<html><head><title>Print Labels</title><style>body { font-family: sans-serif; margin: 0; padding: 20px; display: flex; flex-wrap: wrap; gap: 15px; } .label { border: 2px solid #000; padding: 15px; width: 250px; border-radius: 8px; page-break-inside: avoid; } .title { font-size: 18px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; } .detail { font-size: 14px; margin-bottom: 5px; } .footer { text-align: center; font-size: 12px; font-weight: bold; margin-top: 15px; text-transform: uppercase; }</style></head><body>`;
    items.forEach(item => {
      html += `<div class="label"><div class="title">${item.product_name}</div><div class="detail"><strong>Qty:</strong> ${item.qty} ${item.unit || 'PCS'}</div><div class="detail"><strong>HSN:</strong> ${item.hsn || '-'}</div><div class="detail"><strong>Bill No:</strong> ${invoiceNo}</div><div class="detail"><strong>To:</strong> ${customer}</div><div class="footer">Company Packing Label</div></div>`;
    });
    html += `<script>window.print();</script></body></html>`;
    win.document.write(html);
    win.document.close();
  };

  const submit = async () => {
    if (!customerName) return toast.error("Customer name is required");
    if (hasEmpty) return toast.error("Each line needs product, quantity > 0 and price > 0");

    setSaving(true);
    try {
      // Dynamic Invoice Number Generation
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
      
      // Filter existing invoices for this month to get correct count
      const monthlyBills = existingInvoices.filter(inv => 
        inv.invoice_no?.startsWith(`RAP-${currentYear}-${currentMonth}`)
      );
      
      const nextSequence = monthlyBills.length + 1;
      const invoiceNo = `RAP-${currentYear}-${currentMonth}-${String(nextSequence).padStart(3, '0')}`;

      const itemsForSheet = enriched.map((l) => ({
        product_id: l.product_id,
        product_name: l.product.product_name,
        qty: Number(l.quantity),
        price: Number(l.price),
        hsn: l.hsn,
        unit: l.product.unit || 'PCS'
      }));

      const payload = {
        invoice_no: invoiceNo,
        customer_name: customerName,
        customer_gstin: customerGstin,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        items_json: JSON.stringify(itemsForSheet),
        subtotal: subtotal,
        discount: Number(discount) || 0,
        cgst_rate: Number(cgstRate),
        sgst_rate: Number(sgstRate),
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        grand_total: grandTotal,
        payment_status: paymentStatus,
        notes: notes,
        date: new Date().toISOString().split('T')[0]
      };

      const inv = await sheets.createInvoice(payload);

      for (const item of itemsForSheet) {
        if (sheets.addInventoryTxn) {
          await sheets.addInventoryTxn({
            date: new Date().toISOString(),
            product_id: item.product_id,
            product_name: item.product_name,
            transaction_type: "OUT",
            quantity: item.qty,
            unit: item.unit,
            reference: inv.invoice_no || "BILL",
            remark: `Sold to ${customerName}`
          });
        }
      }

      toast.success(`Invoice ${inv.invoice_no || 'Created'} successfully!`);
      printLabels(itemsForSheet, inv.invoice_no || "NEW", customerName);
      if (inv.id) window.open(`/invoices/${inv.id}/print`, "_blank");
      navigate("/billing");
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl font-semibold">New Bill</h1></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <div className="font-display font-semibold text-lg mb-4">Customer Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Name *</Label><Select value={customerName} onValueChange={handleCustomerSelect}><SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger><SelectContent>{customers.map((c) => <SelectItem key={c.customer_name} value={c.customer_name}>{c.customer_name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Phone</Label><Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} /></div>
              <div><Label>GSTIN</Label><Input value={customerGstin} onChange={(e) => setCustomerGstin(e.target.value)} /></div>
              <div className="md:col-span-2"><Label>Address</Label><Textarea value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} /></div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3"><div className="font-display font-semibold text-lg">Line Items</div><Button variant="outline" size="sm" onClick={addLine}><Plus className="h-4 w-4 mr-1" /> Add Row</Button></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-slate-500 border-b"><th className="py-2">Product</th><th className="py-2">HSN</th><th className="py-2 text-right">Price</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Total</th><th></th></tr></thead>
                <tbody>{enriched.map((l, i) => (<tr key={i} className="border-b"><td className="py-2 pr-2"><Select value={l.product_id} onValueChange={(v) => updateLine(i, { product_id: v })}><SelectTrigger><SelectValue placeholder="Product" /></SelectTrigger><SelectContent>{products.map((p) => <SelectItem key={p.product_id} value={p.product_id}>{p.product_name}</SelectItem>)}</SelectContent></Select></td><td className="py-2 pr-2"><Input className="w-24" value={l.hsn} onChange={(e) => updateLine(i, { hsn: e.target.value })} /></td><td className="py-2 text-right"><Input type="number" className="w-24 text-right" value={l.price} onChange={(e) => updateLine(i, { price: e.target.value })} /></td><td className="py-2 text-right"><Input type="number" className="w-20 text-right" value={l.quantity} onChange={(e) => updateLine(i, { quantity: e.target.value })} /></td><td className="py-2 text-right font-medium">{formatINR(l.lineTotal)}</td><td className="py-2 text-right"><Button variant="ghost" size="sm" onClick={() => removeLine(i)}><Trash2 className="h-4 w-4 text-red-600" /></Button></td></tr>))}</tbody>
              </table>
            </div>
          </Card>
        </div>
        <div>
          <Card className="p-5 sticky top-4">
            <div className="font-display font-semibold mb-4">Total Summary</div>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Payment Status</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Partial Paid">Partial Paid</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between border-t pt-3">
                <span className="font-bold">Grand Total</span>
                <span className="font-bold text-xl text-orange-600">{formatINR(grandTotal)}</span>
              </div>
              
              <Button onClick={submit} disabled={saving} className="w-full mt-4">
                Save, Deduct Stock & Print Label
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}