import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ClipboardList, Boxes, Receipt, ShoppingCart, Truck,
  Users, Video, BarChart3, Wallet, Settings as SettingsIcon, ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getSheetsUrl, sheets } from "@/lib/sheets";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/production-log", label: "Production Log", icon: ClipboardList, testid: "nav-production-log" },
  { to: "/inventory", label: "Inventory", icon: Boxes, testid: "nav-inventory" },
  { to: "/billing", label: "Billing", icon: Receipt, testid: "nav-billing" },
  { to: "/purchase-entry", label: "Purchase Entry", icon: ShoppingCart, testid: "nav-purchase" },
  { to: "/delivery-challan", label: "Delivery Challan", icon: Truck, testid: "nav-delivery" },
  { to: "/staff-attendance", label: "Staff Attendance", icon: Users, testid: "nav-staff" },
  { to: "/cctv", label: "CCTV", icon: Video, testid: "nav-cctv" },
  { to: "/reports", label: "Reports", icon: BarChart3, testid: "nav-reports" },
  { to: "/expenses", label: "Expenses", icon: Wallet, testid: "nav-expenses" },
  { to: "/settings", label: "Settings", icon: SettingsIcon, testid: "nav-settings" },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [url, setUrl] = useState(getSheetsUrl());
  const [connected, setConnected] = useState(null);

  useEffect(() => {
    setUrl(getSheetsUrl());
  }, [location.pathname]);

  useEffect(() => {
    if (!url) {
      setConnected(false);
      return;
    }
    sheets
      .ping()
      .then(() => setConnected(true))
      .catch(() => setConnected(false));
  }, [url]);

  const notConfigured = !url && location.pathname !== "/settings";

  return (
    <div className="min-h-screen w-full bg-slate-100 flex text-slate-900">
      {/* Sidebar - dark with orange accent */}
      <aside
        className="hidden md:flex md:flex-col w-64 min-h-screen bg-[#0f172a] text-slate-200 border-r border-slate-800"
        data-testid="app-sidebar"
      >
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-orange-500 flex items-center justify-center font-display font-bold text-white text-lg">
              R
            </div>
            <div>
              <div className="font-display font-semibold text-lg leading-none">RapidTech</div>
              <div className="text-[10px] tracking-widest text-slate-400 mt-1 uppercase">Business ERP</div>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-slate-800">
          <div className="text-[10px] tracking-widest text-slate-400 uppercase mb-2">Workspace</div>
          <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-sm">
            <span className="truncate">RapidTech Manufacturing</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={n.testid}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`} />
            <span data-testid="connection-status">
              {connected ? "Sheets Connected" : "Sheets Not Connected"}
            </span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {notConfigured ? (
            <div
              className="max-w-2xl mx-auto mt-16 bg-white rounded-xl border border-slate-200 shadow-sm p-8"
              data-testid="setup-required-card"
            >
              <div className="text-orange-600 text-xs uppercase tracking-widest font-semibold">
                Setup Required
              </div>
              <h2 className="font-display text-2xl font-semibold mt-2">
                Connect your Google Sheets backend
              </h2>
              <p className="text-slate-600 mt-2 text-sm">
                All 10 sheets (Production Log, Inventory, Billing, Purchase Entry, Delivery
                Challan, Staff Attendance, CCTV, Reports, Expenses, Settings) will be created
                automatically after you connect. Follow the setup guide at{" "}
                <code className="bg-slate-100 px-1 rounded">/app/apps-script/README.md</code>.
              </p>
              <Button
                className="mt-6 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => navigate("/settings")}
                data-testid="go-to-settings-btn"
              >
                Go to Settings
              </Button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
