import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import GenericModule from "@/pages/GenericModule";
import BillingList from "@/pages/BillingList";
import NewBill from "@/pages/NewBill";
import InvoicePrint from "@/pages/InvoicePrint";
import Settings from "@/pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/production-log" element={<GenericModule moduleKey="ProductionLog" />} />
          <Route path="/inventory" element={<GenericModule moduleKey="Inventory" />} />
          <Route path="/billing" element={<BillingList />} />
          <Route path="/billing/new" element={<NewBill />} />
          <Route path="/purchase-entry" element={<GenericModule moduleKey="PurchaseEntry" />} />
          <Route path="/delivery-challan" element={<GenericModule moduleKey="DeliveryChallan" />} />
          <Route path="/staff-attendance" element={<GenericModule moduleKey="StaffAttendance" />} />
          <Route path="/cctv" element={<GenericModule moduleKey="CCTV" />} />
          <Route path="/reports" element={<GenericModule moduleKey="Reports" />} />
          <Route path="/expenses" element={<GenericModule moduleKey="Expenses" />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/invoices/:id/print" element={<InvoicePrint />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

export default App;
