import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { sheets } from "@/lib/sheets";
import logo from "@/assets/logo.png"; // உங்கள் லோகோ பாத்

export default function SalarySlip() {
  const { staffId, month } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    sheets.list("StaffAttendance").then(allRecords => {
      const filtered = allRecords.filter(r => 
        r.staff_name === staffId && r.date.startsWith(month)
      );

      const presentDays = filtered.filter(r => r.status === "Present").length;
      const totalSalary = presentDays * 500; // சம்பளக் கணக்கீடு

      setData({
        records: filtered,
        presentDays,
        totalSalary,
        companyInfo: {
          name: "RAPID TECH INDUSTRIES",
          address: "NO 47/1, Akkamaouram main road., akkamapuram village,\nsriperumbudur, Kancheepuram, Tamilnadu 631533.",
          phone: "9566058967",
          email: "rapidtech.mktgs@gmail.com/mechpluse.mktg@mail.com"
        }
      });
    });
  }, [staffId, month]);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white border border-gray-300">
      {/* Header with Logo */}
      <div className="flex items-center gap-6 border-b-2 border-gray-300 pb-4 mb-6">
        <img src={logo} alt="Logo" className="h-20 w-20" />
        <div className="text-center w-full">
          <h1 className="text-2xl font-bold">{data.companyInfo.name}</h1>
          <p className="text-sm whitespace-pre-line">{data.companyInfo.address}</p>
          <p className="text-sm font-semibold">{data.companyInfo.phone} | {data.companyInfo.email}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-blue-600 text-center mb-6">Payslip for the month {month}</h2>

      {/* Employee & Salary Details */}
      <div className="grid grid-cols-2 border border-gray-300 mb-6">
        <div className="p-4 border-r border-gray-300">
          <p><strong>Employee Name:</strong> {staffId}</p>
          <p><strong>Designation:</strong> Junior Test Engineer</p>
        </div>
        <div className="p-4">
          <p><strong>Salary Period:</strong> {month} 2026</p>
          <p><strong>Net Paid Days:</strong> {data.presentDays}</p>
        </div>
      </div>

      {/* Earnings Table */}
      <table className="w-full border-collapse border border-gray-300 mb-8">
        <thead>
          <tr className="bg-blue-50">
            <th className="border p-2 text-left">Earnings</th>
            <th className="border p-2 text-right">Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2">Basic Salary ({data.presentDays} days)</td>
            <td className="border p-2 text-right">₹{data.totalSalary}.00</td>
          </tr>
          <tr className="font-bold bg-gray-50">
            <td className="border p-2">Total Earnings</td>
            <td className="border p-2 text-right">₹{data.totalSalary}.00</td>
          </tr>
        </tbody>
      </table>

      {/* Net Payable */}
      <div className="text-lg font-bold">
        <p>Net Payable Amount : ₹{data.totalSalary}.00</p>
      </div>

      <div className="mt-8 no-print">
        <Button onClick={() => window.print()}>Print Payslip</Button>
      </div>
    </div>
  );
}