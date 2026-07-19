import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  ReceiptText,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/inventory", label: "Inventory", icon: Package, testid: "nav-inventory" },
  { to: "/customers", label: "Customers", icon: Users, testid: "nav-customers" },
  { to: "/billing", label: "Billing", icon: ReceiptText, testid: "nav-billing" },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const title = nav.find((n) => location.pathname.startsWith(n.to))?.label || "Billing";

  return (
    <div className="min-h-screen w-full bg-slate-50 flex text-slate-900">
      {/* Sidebar */}
      <aside
        className="hidden md:flex md:flex-col w-64 min-h-screen bg-slate-900 text-slate-100 border-r border-slate-800"
        data-testid="app-sidebar"
      >
        <div className="px-6 py-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-blue-600 flex items-center justify-center font-display font-bold">
              B
            </div>
            <div>
              <div className="font-display font-semibold text-lg leading-none">BillBook</div>
              <div className="text-xs text-slate-400 mt-1">GST Billing & Inventory</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => {
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={n.testid}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white"
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
        <div className="p-3 border-t border-slate-800">
          <Button
            onClick={() => navigate("/billing/new")}
            data-testid="sidebar-new-bill-btn"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1" /> New Bill
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between"
          data-testid="app-header"
        >
          <h1 className="font-display font-semibold text-xl tracking-tight" data-testid="page-title">
            {title}
          </h1>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/billing/new")}
              data-testid="header-new-bill-btn"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1" /> New Bill
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
