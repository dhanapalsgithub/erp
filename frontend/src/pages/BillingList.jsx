import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, formatINR, formatDate } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Printer, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export default function BillingList() {
  const [invoices, setInvoices] = useState([]);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    const { data } = await api.get("/invoices");
    setInvoices(data);
  };
  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    if (!window.confirm("Delete this invoice? Stock will be restored.")) return;
    await api.delete(`/invoices/${id}`);
    toast.success("Invoice deleted, stock restored");
    load();
  };

  const filtered = invoices.filter((i) => {
    const t = q.toLowerCase();
    return (
      !t ||
      i.invoice_no.toLowerCase().includes(t) ||
      i.customer_snapshot?.name?.toLowerCase().includes(t)
    );
  });

  return (
    <div className="space-y-6" data-testid="billing-list-page">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-2xl font-semibold">Billing</div>
          <div className="text-sm text-slate-500">All invoices with print & total summary</div>
        </div>
        <Button
          onClick={() => navigate("/billing/new")}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="new-bill-btn"
        >
          <Plus className="h-4 w-4 mr-1" /> New Bill
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
        <Input
          data-testid="invoice-search"
          className="pl-9"
          placeholder="Search by invoice # or customer"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Card className="shadow-sm border border-slate-200">
        <CardContent className="p-0">
          <table className="w-full text-sm" data-testid="invoices-table">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-600">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Items</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-100" data-testid={`invoice-row-${inv.invoice_no}`}>
                  <td className="py-3 px-4 font-medium">{inv.invoice_no}</td>
                  <td className="py-3 px-4">{formatDate(inv.created_at)}</td>
                  <td className="py-3 px-4">{inv.customer_snapshot?.name}</td>
                  <td className="py-3 px-4 text-right tabular">{inv.items?.length || 0}</td>
                  <td className="py-3 px-4 text-right tabular font-semibold">
                    {formatINR(inv.grand_total)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      className={
                        inv.payment_status === "Paid"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : inv.payment_status === "Partial"
                          ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                      }
                    >
                      {inv.payment_status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/invoices/${inv.id}/print`} target="_blank" rel="noreferrer">
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`print-invoice-${inv.invoice_no}`}
                        >
                          <Printer className="h-4 w-4 mr-1" /> Print
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => remove(inv.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-slate-500 py-8">
                    No invoices found.
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
