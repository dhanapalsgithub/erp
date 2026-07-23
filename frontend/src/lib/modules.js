// Config for the 8 generic list-based modules.
// Dashboard, Billing, Settings are custom pages.

export const MODULES = {
  ProductionLog: {
    label: "Production Log",
    subtitle: "Manage and monitor your production log operations.",
    sheet: "ProductionLog",
    fields: [
      { key: "date", label: "Date", type: "date", required: true },
      // Dropdown for Machines
      { 
        key: "machine", 
        label: "Machine", 
        type: "select", 
        options: ["Extrude 1", "Extrude 2", "Cutting Machine"], 
        required: true 
      },
      // Dropdown for Operators
      { 
        key: "operator", 
        label: "Operator", 
        type: "select", 
        options: ["Arun", "Ravi", "Varun"] 
      },
      // Product fetching from inventory (Type: product_select)
      { key: "product", label: "Product", type: "product_select", required: true },
      { key: "qty", label: "Qty (kgs)", type: "number" },
      { key: "waste", label: "Waste (kgs)", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["In Progress", "Completed", "On Hold"] },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    stats: (rows) => [
      { label: "Total Records", value: rows.length },
      { label: "Total Prod.", value: `${rows.reduce((s, r) => s + Number(r.qty || 0), 0).toLocaleString("en-IN")} KGS` },
      { label: "Total Waste", value: `${rows.reduce((s, r) => s + Number(r.waste || 0), 0).toLocaleString("en-IN")} KGS` },
    ],
    columns: [
      { key: "date", label: "Date", format: "date" },
      { key: "machine", label: "Machine" },
      { key: "operator", label: "Operator" },
      { key: "product", label: "Product" },
      { key: "qty", label: "Qty", align: "right" },
      { key: "waste", label: "Waste", align: "right" },
      { key: "status", label: "Status", badge: true },
    ],
  },

  // lib/modules.js கோப்பில் இதைச் சேர்க்கவும்
Attendance: {
  label: "Staff Attendance",
  sheet: "Attendance",
  columns: [
    { key: "staff_name", label: "Staff Name" },
    { key: "date", label: "Date", format: "date" },
    { key: "branch", label: "Branch" },
    { key: "status", label: "Status", badge: true },
  ],
  fields: [
    { key: "staff_name", label: "Staff Name", required: true },
    { key: "date", label: "Date", type: "date", required: true },
    { key: "branch", label: "Branch", type: "select", options: ["Branch A", "Branch B"], required: true },
    { key: "status", label: "Status", type: "select", options: ["Present", "Absent", "Half Day"], required: true },
  ]
},

  Inventory: {
    label: "Inventory",
    subtitle: "Track opening stock, purchases, sales and current inventory.",
    sheet: "Inventory",
    fields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "product_id", label: "Product ID", type: "text", required: true },
      { key: "product_name", label: "Product Name", type: "text", required: true },
      { key: "transaction_type", label: "Transaction Type", type: "select",
        options: ["Opening Stock", "Purchase", "Sale", "Adjustment", "Waste"], required: true },
      { key: "quantity", label: "Quantity", type: "number", required: true },
      { key: "unit", label: "Unit", type: "text", default: "KGS" },
      { key: "opening_stock", label: "Opening Stock", type: "number" },
      { key: "closing_stock", label: "Closing Stock", type: "number" },
      { key: "reference", label: "Reference", type: "text" },
      { key: "remark", label: "Remark", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["Initial", "Completed", "Pending"] },
    ],
    stats: (rows) => {
      const products = new Set(rows.map((r) => r.product_id).filter(Boolean));
      const today = new Date().toDateString();
      const todayCount = rows.filter((r) => r.date && new Date(r.date).toDateString() === today).length;
      const pending = rows.filter((r) => r.status === "Pending").length;
      return [
        { label: "Total Records", value: rows.length },
        { label: "Today's Activity", value: String(todayCount).padStart(2, "0") },
        { label: "Products Tracked", value: products.size, tone: "warning" },
        { label: "Pending Action", value: String(pending).padStart(2, "0"), tone: "warning" },
      ];
    },
    columns: [
      { key: "id", label: "Inventory ID" },
      { key: "date", label: "Date", format: "date" },
      { key: "product_id", label: "Product ID" },
      { key: "product_name", label: "Product Name" },
      { key: "transaction_type", label: "Type" },
      { key: "quantity", label: "Qty", align: "right" },
      { key: "unit", label: "Unit" },
      { key: "opening_stock", label: "Opening", align: "right" },
      { key: "closing_stock", label: "Closing", align: "right" },
      { key: "reference", label: "Reference" },
      { key: "status", label: "Status", badge: true },
    ],
  },

  PurchaseEntry: {
    label: "Purchase Entry",
    subtitle: "Record raw material and stock purchases.",
    sheet: "PurchaseEntry",
    fields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "supplier", label: "Supplier", type: "text", required: true },
      { key: "invoice_no", label: "Supplier Invoice #", type: "text" },
      { key: "product", label: "Product", type: "text", required: true },
      { key: "quantity", label: "Quantity", type: "number", required: true },
      { key: "unit", label: "Unit", type: "text", default: "KGS" },
      { key: "rate", label: "Rate (₹)", type: "number" },
      { key: "amount", label: "Amount (₹)", type: "number" },
      { key: "gst_amount", label: "GST (₹)", type: "number" },
      { key: "total", label: "Total (₹)", type: "number" },
      { key: "payment_status", label: "Payment", type: "select", options: ["Paid", "Pending", "Partial"] },
    ],
    stats: (rows) => [
      { label: "Total Records", value: rows.length },
      { label: "Total Value", value: `₹${rows.reduce((s, r) => s + Number(r.total || 0), 0).toLocaleString("en-IN")}` },
      { label: "Pending", value: rows.filter((r) => r.payment_status !== "Paid").length, tone: "warning" },
    ],
    columns: [
      { key: "date", label: "Date", format: "date" },
      { key: "supplier", label: "Supplier" },
      { key: "invoice_no", label: "Inv #" },
      { key: "product", label: "Product" },
      { key: "quantity", label: "Qty", align: "right" },
      { key: "rate", label: "Rate", align: "right" },
      { key: "total", label: "Total", align: "right" },
      { key: "payment_status", label: "Payment", badge: true },
    ],
  },

  DeliveryChallan: {
    label: "Delivery Challan",
    subtitle: "Track dispatched goods and delivery status.",
    sheet: "DeliveryChallan",
    fields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "challan_no", label: "Challan #", type: "text", required: true },
      { key: "customer", label: "Customer", type: "text", required: true },
      { key: "vehicle_no", label: "Vehicle #", type: "text" },
      { key: "product", label: "Product", type: "text" },
      { key: "quantity", label: "Quantity", type: "number" },
      { key: "unit", label: "Unit", type: "text", default: "KGS" },
      { key: "destination", label: "Destination", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["Dispatched", "In Transit", "Delivered", "Returned"] },
    ],
    stats: (rows) => [
      { label: "Total Challans", value: rows.length },
      { label: "In Transit", value: rows.filter((r) => r.status === "In Transit").length, tone: "warning" },
      { label: "Delivered", value: rows.filter((r) => r.status === "Delivered").length, tone: "success" },
    ],
    columns: [
      { key: "date", label: "Date", format: "date" },
      { key: "challan_no", label: "Challan #" },
      { key: "customer", label: "Customer" },
      { key: "vehicle_no", label: "Vehicle" },
      { key: "product", label: "Product" },
      { key: "quantity", label: "Qty", align: "right" },
      { key: "destination", label: "Destination" },
      { key: "status", label: "Status", badge: true },
    ],
  },

  StaffAttendance: {
    label: "Staff Attendance",
    subtitle: "Daily attendance and shift records.",
    sheet: "StaffAttendance",
    fields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "staff_name", label: "Staff Name", type: "text", required: true },
      { key: "role", label: "Role", type: "text" },
      { key: "check_in", label: "Check In", type: "text", placeholder: "HH:MM" },
      { key: "check_out", label: "Check Out", type: "text", placeholder: "HH:MM" },
      { key: "hours", label: "Hours", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["Present", "Absent", "Half Day", "Leave"] },
    ],
    stats: (rows) => {
      const today = new Date().toDateString();
      const todayRows = rows.filter((r) => r.date && new Date(r.date).toDateString() === today);
      return [
        { label: "Total Records", value: rows.length },
        { label: "Present Today", value: todayRows.filter((r) => r.status === "Present").length, tone: "success" },
        { label: "Absent Today", value: todayRows.filter((r) => r.status === "Absent").length, tone: "warning" },
      ];
    },
    columns: [
      { key: "date", label: "Date", format: "date" },
      { key: "staff_name", label: "Staff" },
      { key: "role", label: "Role" },
      { key: "check_in", label: "Check In" },
      { key: "check_out", label: "Check Out" },
      { key: "hours", label: "Hours", align: "right" },
      { key: "status", label: "Status", badge: true },
    ],
  },

  CCTV: {
    label: "CCTV",
    subtitle: "Camera status and stream links.",
    sheet: "CCTV",
    fields: [
      { key: "camera_id", label: "Camera ID", type: "text", required: true },
      { key: "location", label: "Location", type: "text", required: true },
      { key: "stream_url", label: "Stream URL", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["Online", "Offline", "Maintenance"] },
      { key: "last_checked", label: "Last Checked", type: "date" },
    ],
    stats: (rows) => [
      { label: "Total Cameras", value: rows.length },
      { label: "Online", value: rows.filter((r) => r.status === "Online").length, tone: "success" },
      { label: "Offline", value: rows.filter((r) => r.status === "Offline").length, tone: "warning" },
    ],
    columns: [
      { key: "camera_id", label: "Camera ID" },
      { key: "location", label: "Location" },
      { key: "stream_url", label: "Stream URL" },
      { key: "status", label: "Status", badge: true },
      { key: "last_checked", label: "Last Checked", format: "date" },
    ],
  },

  Reports: {
    label: "Reports",
    subtitle: "Saved and generated report entries.",
    sheet: "Reports",
    fields: [
      { key: "report_name", label: "Report Name", type: "text", required: true },
      { key: "period", label: "Period", type: "text" },
      { key: "generated_on", label: "Generated On", type: "date" },
      { key: "generated_by", label: "Generated By", type: "text" },
      { key: "summary", label: "Summary", type: "textarea" },
    ],
    stats: (rows) => [{ label: "Total Reports", value: rows.length }],
    columns: [
      { key: "report_name", label: "Report Name" },
      { key: "period", label: "Period" },
      { key: "generated_on", label: "Generated On", format: "date" },
      { key: "generated_by", label: "By" },
    ],
  },

  Expenses: {
    label: "Expenses",
    subtitle: "Log and monitor business expenses.",
    sheet: "Expenses",
    fields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "category", label: "Category", type: "select",
        options: ["Utilities", "Rent", "Salary", "Raw Material", "Transport", "Repair", "Miscellaneous"] },
      { key: "description", label: "Description", type: "text", required: true },
      { key: "amount", label: "Amount (₹)", type: "number", required: true },
      { key: "paid_by", label: "Paid By", type: "text" },
      { key: "payment_mode", label: "Payment Mode", type: "select", options: ["Cash", "UPI", "Bank Transfer", "Cheque"] },
      { key: "reference", label: "Reference", type: "text" },
    ],
    stats: (rows) => [
      { label: "Total Records", value: rows.length },
      { label: "Total Expense", value: `₹${rows.reduce((s, r) => s + Number(r.amount || 0), 0).toLocaleString("en-IN")}` },
    ],
    columns: [
      { key: "date", label: "Date", format: "date" },
      { key: "category", label: "Category", badge: true },
      { key: "description", label: "Description" },
      { key: "amount", label: "Amount", align: "right", format: "currency" },
      { key: "payment_mode", label: "Mode" },
    ],
  },
};
