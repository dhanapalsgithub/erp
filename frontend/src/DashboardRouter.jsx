// src/pages/DashboardRouter.jsx
import Dashboard from "./pages/Dashboard"; // அட்மினின் ப்ரொடக்ஷன் டாஷ்போர்டு
import StaffDashboard from "./components/StaffDashboard"; // ஊழியர்களின் டாஷ்போர்டு

export default function DashboardRouter({ user }) {
  // பயனர் அட்மின் என்றால் ப்ரொடக்ஷன் டாஷ்போர்டைக் காட்டு
  if (user?.role === "admin") {
    return <Dashboard />;
  }
  
  // இல்லையென்றால் ஊழியர் டாஷ்போர்டைக் காட்டு
  return <StaffDashboard user={user} />;
}