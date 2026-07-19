import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, formatINR, formatDate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const COPIES = [
  "Original for Recipient",
  "Duplicate for Transporter",
  "Triplicate for Supplier",
];

function InvoiceCopy({ inv, label }) {
  return (
    <div className="print-copy p-8">
      <div className="print-invoice-card border border-slate-300 rounded-md bg-white p-6 mx-auto max-w-4xl">
        <div className="flex items-start justify-between border-b border-slate-300 pb-4 mb-4">
          <div>
            <div className="text-2xl font-display font-bold tracking-tight">TAX INVOICE</div>
            <div className="text-xs uppercase tracking-widest text-slate-600 mt-1">{label}</div>
          </div>
          <div className="text-right">
            <div className="font-display font-semibold text-lg">BillBook Traders</div>
            <div className="text-xs text-slate-600">GSTIN: 33AABCB1234M1Z5</div>
            <div className="text-xs text-slate-600">Chennai, Tamil Nadu, India</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-5 text-sm">
          <div>
            <div className="text-xs uppercase text-slate-500 mb-1">Bill To</div>
            <div className="font-semibold">{inv.customer_snapshot?.name}</div>
            {inv.customer_snapshot?.address && (
              <div className="text-slate-700 whitespace-pre-line">
                {inv.customer_snapshot.address}
              </div>
            )}
            {inv.customer_snapshot?.phone && (
              <div className="text-slate-700">Ph: {inv.customer_snapshot.phone}</div>
            )}
            {inv.customer_snapshot?.gstin && (
              <div className="text-slate-700">GSTIN: {inv.customer_snapshot.gstin}</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs uppercase text-slate-500 mb-1">Invoice Details</div>
            <div>
              <span className="text-slate-500">Invoice #:</span>{" "}
              <span className="font-semibold">{inv.invoice_no}</span>
            </div>
            <div>
              <span className="text-slate-500">Date:</span> {formatDate(inv.created_at)}
            </div>
            <div>
              <span className="text-slate-500">Status:</span>{" "}
              <span className="font-semibold">{inv.payment_status}</span>
            </div>
          </div>
        </div>

        <table className="w-full text-sm border-collapse mb-5">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="py-2 px-2 border border-slate-300">#</th>
              <th className="py-2 px-2 border border-slate-300">Description</th>
              <th className="py-2 px-2 border border-slate-300">HSN</th>
              <th className="py-2 px-2 border border-slate-300 text-right">Qty</th>
              <th className="py-2 px-2 border border-slate-300 text-right">Rate</th>
              <th className="py-2 px-2 border border-slate-300 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it, i) => (
              <tr key={i}>
                <td className="py-2 px-2 border border-slate-300">{i + 1}</td>
                <td className="py-2 px-2 border border-slate-300">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-slate-500">{it.sku}</div>
                </td>
                <td className="py-2 px-2 border border-slate-300">{it.hsn || "-"}</td>
                <td className="py-2 px-2 border border-slate-300 text-right tabular">
                  {it.quantity} {it.unit}
                </td>
                <td className="py-2 px-2 border border-slate-300 text-right tabular">
                  {formatINR(it.price)}
                </td>
                <td className="py-2 px-2 border border-slate-300 text-right tabular">
                  {formatINR(it.price * it.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-6">
          <div className="text-sm">
            <div className="text-xs uppercase text-slate-500 mb-1">Amount in Words</div>
            <div className="italic">{inv.amount_in_words}</div>
            {inv.notes && (
              <div className="mt-3">
                <div className="text-xs uppercase text-slate-500 mb-1">Notes</div>
                <div className="text-slate-700 whitespace-pre-line">{inv.notes}</div>
              </div>
            )}
          </div>
          <div className="text-sm">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="tabular">{formatINR(inv.subtotal)}</span>
              </div>
              {inv.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Discount</span>
                  <span className="tabular">- {formatINR(inv.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">CGST ({inv.cgst_rate}%)</span>
                <span className="tabular">{formatINR(inv.cgst_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">SGST ({inv.sgst_rate}%)</span>
                <span className="tabular">{formatINR(inv.sgst_amount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-2 mt-2">
                <span className="font-display font-semibold">Grand Total</span>
                <span className="tabular font-display font-bold text-lg">
                  {formatINR(inv.grand_total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 text-xs text-slate-600">
          <div>
            <div>Terms &amp; Conditions:</div>
            <div>Goods once sold will not be taken back or exchanged.</div>
          </div>
          <div className="text-right">
            <div className="h-14"></div>
            <div className="border-t border-slate-400 pt-1 inline-block px-4">
              Authorised Signatory
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoicePrint() {
  const { id } = useParams();
  const [inv, setInv] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/invoices/${id}`);
      setInv(data);
    })();
  }, [id]);

  if (!inv) {
    return <div className="p-10 text-slate-500">Loading invoice...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100" data-testid="invoice-print-page">
      <div className="no-print flex items-center justify-between max-w-4xl mx-auto px-6 py-4">
        <div>
          <div className="font-display font-semibold text-lg">
            Print Preview – {inv.invoice_no}
          </div>
          <div className="text-sm text-slate-600">
            All 3 copies (Original / Duplicate / Triplicate) will be printed on separate pages.
          </div>
        </div>
        <Button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="print-btn"
        >
          <Printer className="h-4 w-4 mr-1" /> Print 3 Copies
        </Button>
      </div>

      <div className="print-area">
        {COPIES.map((label) => (
          <InvoiceCopy key={label} inv={inv} label={label} />
        ))}
      </div>
    </div>
  );
}
