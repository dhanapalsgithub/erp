import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sheets } from "@/lib/sheets";

export default function AttendancePage({ user }) {
  const [loading, setLoading] = useState(false);

  const branches = [
    { name: "Branch 1", lat: 13.021318987654936, lon: 80.14919645220525 },
    { name: "Branch 2", lat: 14.447852256260926, lon: 79.92627536067941 }
  ];

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const markAttendance = async () => {
    if (!user?.name) {
      toast.error("User details not found.");
      return;
    }

    setLoading(true);
    try {
      // ஷீட்டில் உள்ள தலைப்புகளுக்கு ஏற்ப டேட்டாவை வாசித்தல்
      const allRecords = await sheets.list("StaffAttendance");
      const today = new Date().toISOString().slice(0, 10);
      
      // staff_name மூலம் டூப்ளிகேட் சரிபார்த்தல்
      const isDuplicate = allRecords.some(r => r.date === today && r.staff_name === user.name);

      if (isDuplicate) {
        toast.error("You have already marked attendance for today!");
        setLoading(false);
        return;
      }

      if (!navigator.geolocation) {
        toast.error("Geolocation not supported.");
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const nearbyBranch = branches.find(b => getDistance(latitude, longitude, b.lat, b.lon) <= 2);

        if (nearbyBranch) {
          // உங்கள் ஷீட் தலைப்புகளுக்கு (date, staff_name, role, check_in, status) ஏற்ப அப்டேட் செய்யப்பட்டது
          await sheets.create("StaffAttendance", {
            "date": today,
            "staff_name": user.name,
            "role": user.role || "Staff",
            "check_in": new Date().toLocaleTimeString(),
            "status": "Present"
          });
          toast.success(`Attendance marked successfully!`);
        } else {
          toast.error("You are not within 2km of any authorized branch.");
        }
        setLoading(false);
      }, (err) => {
        toast.error("Location access denied.");
        setLoading(false);
      }, { enableHighAccuracy: true });

    } catch (e) {
      console.error("Attendance Error:", e);
      toast.error("Error processing attendance. Please check your sheet connection.");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-slate-50 shadow-sm">
      <h1 className="text-2xl font-bold mb-2">Mark Daily Attendance</h1>
      <p className="text-slate-600 mb-6">
        Hello, {user?.name || "Staff"}. Please click the button below to mark your attendance.
      </p>
      <Button
        onClick={markAttendance}
        disabled={loading}
        className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
      >
        {loading ? "Verifying..." : "Mark Attendance"}
      </Button>
    </div>
  );
}