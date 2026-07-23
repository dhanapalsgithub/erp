import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { sheets, formatDate } from "@/lib/sheets";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import logo from "@/assets/logo.png";
import signature from "@/assets/signature.png";

export default function DCPrint() {
  const { id } = useParams();
  const [dc, setDc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    sheets.get("DeliveryChallan", id)
      .then((data) => {
        setDc(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("API Error:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!dc) return <div className="p-8 text-center">No Data Found!</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white border print:border-0">
      {/* Header */}
      <div className="flex justify-between border-b pb-4 mb-6">
        <img src={logo} alt="Logo" className="h-16" />
        <div className="text-right">
          <h1 className="text-2xl font-bold">DELIVERY CHALLAN</h1>
          <p className="text-sm">DC No: {dc.challan_no || "N/A"}</p>
          <p className="text-sm">Date: {dc.date ? formatDate(dc.date) : "N/A"}</p>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
        <div>
          <p><strong>Customer:</strong> {dc.customer || "-"}</p>
          <p><strong>Vehicle No:</strong> {dc.vehicle_no || "-"}</p>
        </div>
        <div className="text-right">
          <p><strong>Destination:</strong> {dc.destination || "-"}</p>
          <p><strong>Status:</strong> {dc.status || "-"}</p>
        </div>
      </div>

      {/* Items Table */}
      {/* Items Table - Unit காலம் சேர்க்கப்பட்டது */}
      <table className="w-full mb-8 border-collapse">
        <thead className="bg-slate-100">
          <tr>
            <th className="border p-2 text-left">Description</th>
            <th className="border p-2 text-right">Qty</th>
            <th className="border p-2 text-right">Unit</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2">{dc.product || "-"}</td>
            {/* Qty பகுதியில் எண் மட்டும் வரும் */}
            <td className="border p-2 text-right">{dc.quantity || "0"}</td>
            {/* Unit காலமில் KGS அல்லது ஷீட்டில் உள்ள மதிப்பு வரும் */}
            <td className="border p-2 text-right">{dc.unit || "KGS"}</td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div className="flex justify-between items-end mt-16">
        <div>Received By: _______________</div>
        <div className="text-right">
          <img src={signature} alt="Signature" className="h-12 mb-1" />
          <p className="border-t pt-1">Authorized Signatory</p>
        </div>
      </div>

      <div className="no-print mt-8 text-center">
        <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print DC</Button>
      </div>
    </div>
  );
}