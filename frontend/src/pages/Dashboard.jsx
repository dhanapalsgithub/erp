import { useEffect, useState } from "react";
import { api, formatINR, formatDate } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, IndianRupee, Package, Users, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  const load = async () => {
    const { data } = await api.get("/dashboard/stats");
    setStats(data);
  };

  useEffect(() => {
    load();
  }, []);

  const cards = [
    {
      label: "Total Sales",
      value: formatINR(stats?.total_sales || 0),
      icon: IndianRupee,
      tone: "text-blue-600",
      testid: "stat-total-sales",
    },
    {
      label: "Total Invoices",
      value: stats?.total_invoices ?? 0,
      icon: FileText,
      tone: "text-emerald-600",
      testid: "stat-total-invoices",
    },
    {
      label: "Pending Amount",
      value: formatINR(stats?.pending_amount || 0),
      icon: IndianRupee,
      tone: "text-amber-600",
      testid: "stat-pending-amount",
    },
    {
      label: "Low Stock Items",
      value: stats?.low_stock_count ?? 0,
      icon: AlertTriangle,
      tone: "text-red-600",
      testid: "stat-low-stock",
    },
  ];

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="shadow-sm border border-slate-200" data-testid={c.testid}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">{c.label}</div>
                    <div className="mt-2 text-2xl font-display font-semibold tabular">{c.value}</div>
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
        <Card className="lg:col-span-2 shadow-sm border border-slate-200" data-testid="recent-invoices-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-display text-lg font-semibold">Recent Invoices</div>
                <div className="text-sm text-slate-500">Last 5 billing entries</div>
              </div>
              <Link to="/billing" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200 text-slate-600">
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
                    <td className="py-2">{inv.customer_snapshot?.name}</td>
                    <td className="py-2">{formatDate(inv.created_at)}</td>
                    <td className="py-2 text-right tabular">{formatINR(inv.grand_total)}</td>
                    <td className="py-2">
                      <Badge
                        variant="outline"
                        className={
                          inv.payment_status === "Paid"
                            ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                            : inv.payment_status === "Partial"
                            ? "border-amber-300 text-amber-700 bg-amber-50"
                            : "border-slate-300 text-slate-700"
                        }
                      >
                        {inv.payment_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {(!stats?.recent_invoices || stats.recent_invoices.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No invoices yet. Create your first bill.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-200" data-testid="low-stock-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div className="font-display text-lg font-semibold">Low Stock Alerts</div>
            </div>
            <div className="space-y-3">
              {(stats?.low_stock_items || []).map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.sku}</div>
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
