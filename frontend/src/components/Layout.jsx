import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ClipboardList, Boxes, Receipt, ShoppingCart, Truck,
  Users, Video, BarChart3, Wallet, Settings as SettingsIcon, ChevronDown,
  Menu, X // Menu மற்றும் X ஐகான்களை சேர்த்துள்ளேன்
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

export default function Layout({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [url, setUrl] = useState(getSheetsUrl());
  const [connected, setConnected] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // மொபைல் மெனுவிற்கான state

  const isAdmin = user?.role === 'admin';

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
      
      {/* மொபைல் ஹெடர் - இது மொபைலில் மட்டும் தெரியும் */}
      <div className="md:hidden fixed top-0 w-full bg-[#0f172a] text-white p-4 flex items-center justify-between z-40">
        <span className="font-bold">RapidTech</span>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar - மொபைலில் toggle ஆகும் வகையில் மாற்றப்பட்டுள்ளது */}
      <aside
        className={`${
          isSidebarOpen ? "flex" : "hidden"
        } md:flex flex-col w-64 h-screen bg-[#0f172a] text-slate-200 border-r border-slate-800 fixed md:relative z-50 pt-16 md:pt-0`}
        data-testid="app-sidebar"
      >
        <div className="px-5 py-5 border-b border-slate-800 hidden md:block">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-orange-500 flex items-center justify-center font-display font-bold text-white text-lg">R</div>
            <div>
              <div className="font-display font-semibold text-lg leading-none">RapidTech</div>
              <div className="text-[10px] tracking-widest text-slate-400 mt-1 uppercase">Business ERP</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((n) => {
            if (!isAdmin && n.label !== "Dashboard") return null;

            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setIsSidebarOpen(false)} // லிங்க் கிளிக் செய்தால் மெனு மூடிவிடும்
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
            <span>{connected ? "Sheets Connected" : "Sheets Not Connected"}</span>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-slate-800"
              onClick={onLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 pt-16 md:pt-0">
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {notConfigured ? (
            <div className="max-w-2xl mx-auto mt-16 bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              <h2 className="font-display text-2xl font-semibold mt-2">Connect your Google Sheets</h2>
              <Button className="mt-6 bg-orange-500" onClick={() => navigate("/settings")}>Go to Settings</Button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}