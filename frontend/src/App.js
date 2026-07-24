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
import GenericModule from "@/pages/GenericModule";
import BillingList from "@/pages/BillingList";
import NewBill from "@/pages/NewBill";
import Settings from "@/pages/Settings";
import DCPrint from "@/components/DCPrint";
import { useState } from "react";
import LoginPage from "./LoginPage";
import SalarySlip from "./components/SalarySlip";
import DashboardRouter from "./DashboardRouter";
import InvoicePrint from "./pages/InvoicePrint"; // உங்கள் கோப்பு எந்த ஃபோல்டரில் உள்ளதோ அதற்கு ஏற்ப பாதையை மாற்றவும்

function App() {
  // localStorage-ல் இருந்து பயனரை எடுக்கும் வசதி
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // லாகின் செய்யும்போது localStorage-ல் சேமிக்கும் செயல்பாடு
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // லாக்அவுட் செய்யும்போது நீக்கும் செயல்பாடு
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
   <BrowserRouter>
  <Routes>
    {/* லாகின் பக்கம் */}
    <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

    {/* லாகின் செய்திருந்தால் மட்டும் தெரியும் Layout பக்கங்கள் */}
    <Route element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}>
      <Route path="/dashboard" element={<DashboardRouter user={user} />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
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

    {/* Layout-க்கு வெளியே உள்ள பிரிண்ட் ரூட்டுகள் (இவை Routes-க்குள் இருக்க வேண்டும்) */}
    <Route 
      path="/salary-print/:staffId/:month" 
      element={user ? <SalarySlip /> : <Navigate to="/login" />} 
    />
    <Route 
      path="/print/dc/:id" 
      element={user ? <DCPrint /> : <Navigate to="/login" />} 
    />
    {/* புதிய இன்வாய்ஸ் பிரிண்ட் ரூட் (Routes-க்குள் வைக்கப்பட்டது) */}
    <Route 
      path="/invoices/:id/print" 
      element={user ? <InvoicePrint /> : <Navigate to="/login" />} 
    />
  </Routes>
  
  <Toaster position="top-right" richColors />
</BrowserRouter>8c2ba8dd
  );
}

export default App;