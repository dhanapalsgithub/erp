import { useEffect, useState } from "react";
import { sheets, formatINR, formatDate } from "@/lib/sheets";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IndianRupee, FileText, AlertTriangle, Boxes, Wallet, Factory,
  TrendingUp, TrendingDown, ClipboardList, DollarSign, ChevronLeft, ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");
  
  // Pagination State
  const [recordPage, setRecordPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    sheets
      .stats()
      .then(setStats)
      .catch((e) => setErr(e.message));
  }, []);

  if (err) {
    return (
      <div className="max-w-xl bg-red-50 border border-red-200 text-red-800 rounded-md p-6">
        <div className="font-semibold">Cannot load dashboard</div>
        <div className="text-sm mt-1">{err}</div>
      </div>
    );
  }

  // நிதி கணக்கீடுகள்
  const grossTotal = stats?.monthly_gross || 0;
  const totalExpense = stats?.monthly_expense || 0;
  const netProfit = grossTotal - totalExpense;

  // Pagination Logic for Monthly Records
  const monthlyRecords = stats?.monthly_records || [];
  const totalRecordPages = Math.ceil(monthlyRecords.length / rowsPerPage);
  const paginatedRecords = monthlyRecords.slice(
    (recordPage - 1) * rowsPerPage,
    recordPage * rowsPerPage
  );

  const summaryCards = [
    { label: "Monthly Gross", value: formatINR(grossTotal), icon: TrendingUp, tone: "text-emerald-600" },
    { label: "Expenses", value: formatINR(totalExpense), icon: TrendingDown, tone: "text-red-600" },
    { label: "Net Profit", value: formatINR(netProfit), icon: DollarSign, tone: "text-orange-600" },
    { label: "Monthly DC Count", value: stats?.monthly_dc_count ?? 0, icon: ClipboardList, tone: "text-blue-600" },
  ];

  const statCards = [
    { label: "Total Sales", value: formatINR(stats?.total_sales || 0), icon: IndianRupee, tone: "text-orange-600" },
    { label: "Total Invoices", value: stats?.total_invoices ?? 0, icon: FileText, tone: "text-blue-600" },
    { label: "Pending Amount", value: formatINR(stats?.pending_amount || 0), icon: Wallet, tone: "text-amber-600" },
    { label: "Low Stock", value: stats?.low_stock_count ?? 0, icon: AlertTriangle, tone: "text-red-600" },
    { label: "Total Production", value: `${(stats?.total_production ?? 0).toLocaleString("en-IN")} kgs`, icon: Factory, tone: "text-emerald-600" },
    { label: "Products", value: stats?.inventory_products ?? 0, icon: Boxes, tone: "text-slate-700" },
  ];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* நிதி சுருக்கம் */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <Card key={c.label} className="border-t-4 border-t-slate-300">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase">{c.label}</p>
                <p className="text-xl font-bold mt-1">{c.value}</p>
              </div>
              <c.icon className={`h-6 w-6 ${c.tone}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* மற்ற புள்ளிவிவரங்கள் */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((c) => (
          <Card key={c.label} className="shadow-sm">
            <CardContent className="p-4 text-center">
              <c.icon className={`h-5 w-5 mx-auto ${c.tone}`} />
              <div className="text-sm font-semibold mt-2">{c.value}</div>
              <div className="text-[10px] text-slate-500 uppercase">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Records Table with Pagination */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-display text-lg font-semibold mb-4">Monthly Bills & DC Records</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 uppercase text-[11px] border-b">
                  <th className="py-2">Date</th>
                  <th className="py-2">Ref #</th>
                  <th className="py-2">Type</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((rec, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">{formatDate(rec.date)}</td>
                    <td className="py-2 font-medium">{rec.ref_no}</td>
                    <td className="py-2"><Badge variant="outline">{rec.type}</Badge></td>
                    <td className="py-2 text-right">{formatINR(rec.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-slate-500">Page {recordPage} of {totalRecordPages || 1}</span>
              <div className="flex gap-2">
                <button 
                  disabled={recordPage === 1}
                  onClick={() => setRecordPage(p => p - 1)}
                  className="p-1 border rounded hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button 
                  disabled={recordPage >= totalRecordPages}
                  onClick={() => setRecordPage(p => p + 1)}
                  className="p-1 border rounded hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div className="font-display text-lg font-semibold">Low Stock</div>
            </div>
            <div className="space-y-3">
              {(stats?.low_stock_items || []).map((p) => (
                <div key={p.product_id} className="flex justify-between border-b pb-2">
                  <span>{p.product_name}</span>
                  <Badge variant="destructive">{p.stock} left</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}