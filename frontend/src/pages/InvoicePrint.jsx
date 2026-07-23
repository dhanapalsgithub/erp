import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { sheets, formatINR, formatDate } from "@/lib/sheets";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
// 1. Import the logo image
import logo from "@/assets/logo.png";
// 2. Import the signature image
import signature from "@/assets/signature.png";

const COPIES = ["Original for Recipient", "Duplicate for Transporter", "Triplicate for Supplier"];

// Helper function to convert number to words
const numberToWords = (num) => {
  if (!num || isNaN(num)) return "";
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  // Using new RegExp to avoid slash syntax issues in build environments
  const n = ('000000000' + Math.floor(num)).slice(-9).match(new RegExp('^(\\d{2})(\\d{2})(\\d{2})(\\d{1})(\\d{2})$'));
  
  if (!n) return ''; 
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return (str != '') ? str + 'Rupees Only' : '';
};

function InvoiceCopy({ inv, items, label, isOriginal, stockMap }) {
  return (
    <div className="print-copy p-8">
      <div className="print-invoice-card border border-slate-300 rounded-md bg-white p-6 mx-auto max-w-4xl">
        <div className="flex items-center justify-between border-b border-slate-300 pb-4 mb-4">
          <div className="flex items-center gap-4">
            <img src={logo} alt="RapidTech Logo" className="h-16 w-auto" />
            <div>
              <div className="text-2xl font-display font-bold tracking-tight">TAX INVOICE</div>
              <div className="text-xs uppercase tracking-widest text-slate-600 mt-1">{label}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display font-semibold text-lg">RapidTech Manufacturing</div>
            <div className="text-xs text-slate-600">GSTIN: 33AABCB1234M1Z5</div>
            <div className="text-xs text-slate-600">Chennai, Tamil Nadu, India</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-5 text-sm">
          <div>
            <div className="text-xs uppercase text-slate-500 mb-1">Bill To</div>
            <div className="font-semibold">{inv.customer_name}</div>
            {inv.customer_address && (
              <div className="text-slate-700 whitespace-pre-line">{inv.customer_address}</div>
            )}
            {inv.customer_phone && <div className="text-slate-700">Ph: {inv.customer_phone}</div>}
            {inv.customer_gstin && <div className="text-slate-700">GSTIN: {inv.customer_gstin}</div>}
          </div>
          <div className="text-right">
            <div className="text-xs uppercase text-slate-500 mb-1">Invoice Details</div>
            <div><span className="text-slate-500">Invoice #:</span> <span className="font-semibold">{inv.invoice_no}</span></div>
            <div><span className="text-slate-500">Date:</span> {formatDate(inv.date)}</div>
            <div><span className="text-slate-500">Status:</span> <span className="font-semibold">{inv.payment_status}</span></div>
          </div>
        </div>

        <table className="w-full text-sm border-collapse mb-5">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="py-2 px-2 border border-slate-300">#</th>
              <th className="py-2 px-2 border border-slate-300">Description</th>
              <th className="py-2 px-2 border border-slate-300 text-right">Qty</th>
              <th className="py-2 px-2 border border-slate-300 text-right">Rate</th>
              <th className="py-2 px-2 border border-slate-300 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td className="py-2 px-2 border border-slate-300">{i + 1}</td>
                <td className="py-2 px-2 border border-slate-300">
                  <div className="font-medium">{it.product_name}</div>
                  <div className="text-xs text-slate-500">{it.product_id}</div>
                </td>
                <td className="py-2 px-2 border border-slate-300 text-right tabular">
                  {it.qty} {it.unit}
                </td>
                <td className="py-2 px-2 border border-slate-300 text-right tabular">{formatINR(it.price)}</td>
                <td className="py-2 px-2 border border-slate-300 text-right tabular">
                  {formatINR(Number(it.price) * Number(it.qty))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-6">
          <div className="text-sm">
            <div className="text-xs uppercase text-slate-500 mb-1">Amount in Words</div>
            <div className="italic">{inv.amount_in_words || numberToWords(inv.grand_total)}</div>
            {inv.notes && (
              <div className="mt-3">
                <div className="text-xs uppercase text-slate-500 mb-1">Notes</div>
                <div className="text-slate-700 whitespace-pre-line">{inv.notes}</div>
              </div>
            )}
          </div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="tabular">{formatINR(inv.subtotal)}</span></div>
            {Number(inv.discount) > 0 && (
              <div className="flex justify-between"><span className="text-slate-600">Discount</span><span className="tabular">- {formatINR(inv.discount)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-slate-600">CGST ({inv.cgst_rate}%)</span><span className="tabular">{formatINR(inv.cgst_amount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">SGST ({inv.sgst_rate}%)</span><span className="tabular">{formatINR(inv.sgst_amount)}</span></div>
            <div className="flex justify-between border-t border-slate-300 pt-2 mt-2">
              <span className="font-display font-semibold">Grand Total</span>
              <span className="tabular font-display font-bold text-lg">{formatINR(inv.grand_total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 text-xs text-slate-600">
          <div>
            <div>Terms &amp; Conditions:</div>
            <div>Goods once sold will not be taken back or exchanged.</div>
          </div>
          <div className="text-right">
            <div className="h-16 flex justify-end mb-1">
              <img src={signature} alt="Authorised Signature" className="h-full w-auto" />
            </div>
            <div className="border-t border-slate-400 pt-1 inline-block px-4">Authorised Signatory</div>
          </div>
        </div>

        {/* Packing Labels Section */}
        {isOriginal && (
          <div className="mt-8 pt-8 border-t-2 border-dashed">
            <h3 className="font-bold mb-4 text-sm">Packing Labels</h3>
            <div className="flex flex-wrap gap-4">
              {items.map((it, i) => {
                const totalStock = stockMap[it.product_id] || 0;
                const invQty = Number(it.qty || 0);
                const balance = totalStock - invQty;

                return (
                  <div key={i} className="border border-black p-3 w-48 text-xs">
                    <div className="font-bold">{it.product_name}</div>
                    <div>Total Stock: {totalStock} kgs</div>
                    <div className="text-blue-600">Taking Qty: {invQty} kgs</div>
                    {/* <div className="font-semibold text-green-700">Balance: {balance} kgs</div> */}
                    <div className="mt-1 border-t border-black pt-1">Bill: {inv.invoice_no}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvoicePrint() {
  const { id } = useParams();
  const [inv, setInv] = useState(null);
  const [stockMap, setStockMap] = useState({});
  const [err, setErr] = useState("");

  useEffect(() => {
    sheets.get("Billing", id).then((d) => {
      if (d) {
        setInv(d);
        sheets.list("Inventory").then((inventory) => {
          const map = {};
          inventory.forEach(item => {
             map[item.product_id] = Number(item.closing_stock || 0);
          });
          setStockMap(map);
        });
      } else {
        setErr("Invoice not found");
      }
    }).catch((e) => {
      console.error("Error fetching data:", e);
      setErr(e.message);
    });
  }, [id]);

  if (err) return <div className="p-10 text-red-600">{err}</div>;
  if (!inv) return <div className="p-10 text-slate-500">Loading invoice...</div>;

  let items = [];
  try {
    items = JSON.parse(inv.items_json || "[]");
  } catch {
    items = [];
  }

  return (
    <div className="min-h-screen bg-slate-100" data-testid="invoice-print-page">
      <div className="no-print flex items-center justify-between max-w-4xl mx-auto px-6 py-4">
        <div>
          <div className="font-display font-semibold text-lg">Print Preview – {inv.invoice_no}</div>
          <div className="text-sm text-slate-600">
            All 3 copies (Original / Duplicate / Triplicate) will be printed on separate pages.
          </div>
        </div>
        <Button
          onClick={() => window.print()}
          className="bg-orange-500 hover:bg-orange-600 text-white"
          data-testid="print-btn"
        >
          <Printer className="h-4 w-4 mr-1" /> Print 3 Copies
        </Button>
      </div>

      <div className="print-area">
        {COPIES.map((label) => (
          <InvoiceCopy
            key={label}
            inv={inv}
            items={items}
            label={label}
            isOriginal={label === "Original for Recipient"}
            stockMap={stockMap}
          />
        ))}
      </div>
    </div>
  );
}