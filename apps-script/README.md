# RapidTech Business ERP — Google Sheets Backend Setup

This app uses **Google Sheets** as its backend via a Google **Apps Script Web App**. Follow these steps once — takes ~3 minutes.

## 1. Create a new Google Sheet
1. Go to https://sheets.google.com → **Blank**.
2. Rename it e.g. `RapidTech ERP DB`.

## 2. Paste the Apps Script
1. In the sheet: **Extensions → Apps Script**.
2. Delete the default `Code.gs` content.
3. Copy the entire contents of **[`/app/apps-script/Code.gs`](./Code.gs)** and paste it in.
4. Click the **Save** icon (or `Ctrl+S`) and name the project `RapidTech ERP API`.

## 3. Deploy as a Web App
1. Top-right: **Deploy → New deployment**.
2. Click the gear icon and select **Web app**.
3. Configure:
   - **Description**: `RapidTech ERP v1`
   - **Execute as**: **Me** (your Google account)
   - **Who has access**: **Anyone**
4. Click **Deploy**. Authorize when prompted (choose your account → "Advanced" → "Go to project → Allow").
5. Copy the **Web app URL** (it ends in `/exec`).

## 4. Paste the URL in the ERP app
1. Open the ERP app in your browser.
2. It will show a **"Configure Google Sheets"** screen automatically on first launch.
3. Paste the `/exec` URL and click **Save & Connect**.
4. Done. All 10 sheets (`ProductionLog`, `Inventory`, `Billing`, `PurchaseEntry`, `DeliveryChallan`, `StaffAttendance`, `CCTV`, `Reports`, `Expenses`, `Settings`) will be auto-created with headers on first API call.

## Notes
- **Every time you change the script**, click **Deploy → Manage deployments → pencil icon → New version** and re-Deploy so the change goes live.
- The script auto-creates missing header columns, so you never need to edit the sheet manually.
- Inventory is a **ledger** (opening/closing stock per transaction). When you save a Billing invoice, the app posts `Sale` transactions to the Inventory sheet automatically, so stock is always in sync.

## Sheet columns (reference)
| Sheet | Columns |
|---|---|
| ProductionLog | id, date, machine, operator, product, qty, waste, status, notes |
| Inventory | id, date, product_id, product_name, transaction_type, quantity, unit, opening_stock, closing_stock, reference, remark, status |
| Billing | id, invoice_no, date, customer_name, customer_gstin, customer_phone, customer_address, items_json, subtotal, discount, cgst_rate, sgst_rate, cgst_amount, sgst_amount, grand_total, amount_in_words, payment_status, notes |
| PurchaseEntry | id, date, supplier, invoice_no, product, quantity, unit, rate, amount, gst_amount, total, payment_status |
| DeliveryChallan | id, date, challan_no, customer, vehicle_no, product, quantity, unit, destination, status |
| StaffAttendance | id, date, staff_name, role, check_in, check_out, hours, status |
| CCTV | id, camera_id, location, stream_url, status, last_checked |
| Reports | id, report_name, period, generated_on, generated_by, summary |
| Expenses | id, date, category, description, amount, paid_by, payment_mode, reference |
| Settings | id, key, value |
