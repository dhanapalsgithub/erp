import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AttendancePage from "./AttendancePage"; 

export default function StaffDashboard({ user }) {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState("2026-07");

  // ஊழியர்களின் சம்பளப் பட்டியல் (இங்கே சம்பளத்தை மாற்றிக்கொள்ளலாம்)
  const staffSalaryData = [
    { name: "Hari", wage: 600 },
    { name: "Dhanapal", wage: 550 },
    { name: "Ravi", wage: 500 },
    { name: "Vijay", wage: 700 }
  ];

  if (!user) return null;

  // லாக்-இன் செய்த ஊழியரின் சம்பளத்தை எடுக்கவும்
  const currentStaffWage = staffSalaryData.find(s => s.name === user.name)?.wage || 500;

  return (
    <div className="p-6 space-y-8">
      <section>
        <h2 className="text-xl font-bold mb-4">Daily Attendance</h2>
        <AttendancePage user={user} />
      </section>

      <section className="p-6 border rounded-lg bg-slate-50 shadow-sm">
        <h2 className="text-xl font-bold mb-4">My Salary Slips</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border p-2 rounded-md w-full sm:w-auto"
          />
          
          {/* சம்பளத்தை wage என்ற query parameter மூலம் அனுப்புகிறோம் */}
          <Button 
            onClick={() => navigate(`/salary-print/${user.name}/${selectedMonth}?wage=${currentStaffWage}`)}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          >
            Print {selectedMonth} Slip
          </Button>
        </div>
      </section>
    </div>
  );
}