import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sheets, formatINR, formatDate } from "@/lib/sheets";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Plus, Printer, Trash2, Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function BillingList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const load = async () => {
    setLoading(true);
    try {
      const data = await sheets.list("Billing");
      setInvoices(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (e) {
      toast.error(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Reset page to 1 whenever search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [q]);

  const updateStatus = async (id, newStatus) => {
    try {
      await sheets.update("Billing", id, { payment_status: newStatus });
      toast.success("Status updated successfully");
      load(); 
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this invoice? (Note: stock in the Inventory sheet will NOT be automatically restored)")) return;
    try {
      await sheets.remove("Billing", id);
      toast.success("Invoice deleted");
      load();
    } catch (e) {
      toast.error(e.message || "Delete failed");
    }
  };

  const exportCSV = () => {
    const cols = ["invoice_no", "date", "customer_name", "subtotal", "cgst_amount", "sgst_amount", "grand_total", "payment_status"];
    const header = cols.join(",");
    const body = invoices
      .map((r) => cols.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Billing.csv";
    a.click();
  };

  // Filtering Logic
  const filtered = invoices.filter((i) => {
    const t = q.toLowerCase();
    return (
      !t ||
      String(i.invoice_no || "").toLowerCase().includes(t) ||
      String(i.customer_name || "").toLowerCase().includes(t)
    );
  });

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginatedInvoices = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="space-y-6" data-testid="billing-list-page">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-orange-600 text-xs uppercase tracking-widest font-semibold">Overview</div>
          <h1 className="font-display text-3xl font-semibold">Billing</h1>
          <p className="text-slate-600 mt-1 text-sm">
            GST invoices with total summary and 3-copy print. Saving an invoice auto-posts a Sale
            transaction to the Inventory sheet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button
            onClick={() => navigate("/billing/new")}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            data-testid="new-bill-btn"
          >
            <Plus className="h-4 w-4 mr-1" /> Add New
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border border-slate-200">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500">Total Invoices</div>
            <div className="mt-2 font-display text-2xl font-semibold tabular">{invoices.length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border border-slate-200">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500">Total Sales</div>
            <div className="mt-2 font-display text-2xl font-semibold tabular">
              {formatINR(invoices.reduce((s, i) => s + Number(i.grand_total || 0), 0))}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border border-slate-200">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500">Pending Amount</div>
            <div className="mt-2 font-display text-2xl font-semibold tabular text-orange-600">
              {formatINR(
                invoices
                  .filter((i) => i.payment_status !== "Paid")
                  .reduce((s, i) => s + Number(i.grand_total || 0), 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border border-slate-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="font-display text-lg font-semibold">Billing Register</div>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                data-testid="invoice-search"
                className="pl-9 w-64"
                placeholder="Search invoice # or customer"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="invoices-table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-500 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  <th className="py-3 px-3 text-right">GST</th>
                  <th className="py-3 px-3 text-right">Grand Total</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="py-8 text-center text-slate-500">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-slate-500">No invoices found.</td></tr>
                ) : (
                  paginatedInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-medium">{inv.invoice_no}</td>
                      <td className="py-3 px-3">{formatDate(inv.date)}</td>
                      <td className="py-3 px-3">{inv.customer_name}</td>
                      <td className="py-3 px-3 text-right tabular">{formatINR(inv.subtotal)}</td>
                      <td className="py-3 px-3 text-right tabular">
                        {formatINR(Number(inv.cgst_amount || 0) + Number(inv.sgst_amount || 0))}
                      </td>
                      <td className="py-3 px-3 text-right tabular font-semibold">
                        {formatINR(inv.grand_total)}
                      </td>
                      <td className="py-3 px-3">
                        <Select 
                          value={inv.payment_status} 
                          onValueChange={(val) => updateStatus(inv.id, val)}
                        >
                          <SelectTrigger className="w-[110px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Partial">Partial</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/invoices/${inv.id}/print`} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm" data-testid={`print-invoice-${inv.invoice_no}`}>
                              <Printer className="h-4 w-4 mr-1" /> Print
                            </Button>
                          </Link>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => remove(inv.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filtered.length > rowsPerPage && (
            <div className="flex items-center justify-between mt-4 px-2">
              <p className="text-xs text-slate-500">
                Showing {Math.min((currentPage - 1) * rowsPerPage + 1, filtered.length)} - {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}