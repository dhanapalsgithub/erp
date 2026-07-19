import { useEffect, useState } from "react";
import { sheets, formatINR, formatDate } from "@/lib/sheets";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IndianRupee, FileText, AlertTriangle, Boxes, Wallet, Factory,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");

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

  const cards = [
    { label: "Total Sales", value: formatINR(stats?.total_sales || 0), icon: IndianRupee, tone: "text-orange-600" },
    { label: "Total Invoices", value: stats?.total_invoices ?? 0, icon: FileText, tone: "text-blue-600" },
    { label: "Pending Amount", value: formatINR(stats?.pending_amount || 0), icon: Wallet, tone: "text-amber-600" },
    { label: "Low Stock Items", value: stats?.low_stock_count ?? 0, icon: AlertTriangle, tone: "text-red-600" },
    { label: "Total Production (kgs)", value: (stats?.total_production ?? 0).toLocaleString("en-IN"), icon: Factory, tone: "text-emerald-600" },
    { label: "Products Tracked", value: stats?.inventory_products ?? 0, icon: Boxes, tone: "text-slate-700" },
  ];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <div className="text-orange-600 text-xs uppercase tracking-widest font-semibold">Overview</div>
        <h1 className="font-display text-3xl font-semibold">Dashboard</h1>
        <p className="text-slate-600 mt-1 text-sm">Live snapshot from your Google Sheets backend.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="shadow-sm border border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">{c.label}</div>
                    <div className="mt-2 font-display text-2xl font-semibold tabular">{c.value}</div>
                  </div>
                  <div className={`p-2 rounded-md bg-slate-50 ${c.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-display text-lg font-semibold">Recent Invoices</div>
                <div className="text-sm text-slate-500">Last 5 bills from the Billing sheet</div>
              </div>
              <Link to="/billing" className="text-sm text-orange-600 hover:underline">View all</Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200 text-slate-500 uppercase text-[11px] tracking-wider">
                  <th className="py-2">Invoice #</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Date</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recent_invoices || []).map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100">
                    <td className="py-2 font-medium">{inv.invoice_no}</td>
                    <td className="py-2">{inv.customer_name}</td>
                    <td className="py-2">{formatDate(inv.date)}</td>
                    <td className="py-2 text-right tabular">{formatINR(inv.grand_total)}</td>
                    <td className="py-2">
                      <Badge className={
                        inv.payment_status === "Paid"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : inv.payment_status === "Partial"
                          ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                      }>
                        {inv.payment_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {(!stats?.recent_invoices || stats.recent_invoices.length === 0) && (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-500">No invoices yet.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div className="font-display text-lg font-semibold">Low Stock Alerts</div>
            </div>
            <div className="space-y-3">
              {(stats?.low_stock_items || []).map((p) => (
                <div key={p.product_id} className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <div className="font-medium">{p.product_name}</div>
                    <div className="text-xs text-slate-500">{p.product_id}</div>
                  </div>
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100">{p.stock} left</Badge>
                </div>
              ))}
              {(!stats?.low_stock_items || stats.low_stock_items.length === 0) && (
                <div className="text-sm text-slate-500">All items are well-stocked.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
