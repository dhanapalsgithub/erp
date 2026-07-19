# RapidTech Business ERP — Google Sheets Backend Edition

## Original Problem Statement
> Round 1: "i need bill menu need to total summary and able to print three copies one is original copy and dublicate copy triplacte copy and auto dedect stcok form inventrit table"
> Round 2: "make 11 componet for 11 menu and all menu have sheet in google sheet so google sheet is a backenf"

## Architecture (v2)
- **Backend**: 100% Google Sheets via a Google **Apps Script Web App** (`/app/apps-script/Code.gs`). No database, no FastAPI usage from the app. FastAPI process still runs but is unused by the frontend.
- **Frontend**: React (Router + Shadcn UI + Tailwind). Talks to the Apps Script `/exec` URL directly. URL is stored in `localStorage`.
- **Setup gate**: If the URL is not configured, every page except `/settings` shows a "Connect your Google Sheets backend" card.

## 11 Menus (all live)
1. Dashboard (aggregates stats from other sheets via `action=stats`)
2. Production Log
3. Inventory (stock ledger with opening/closing per transaction)
4. Billing (retains 3-copy print + auto stock deduction)
5. Purchase Entry
6. Delivery Challan
7. Staff Attendance
8. CCTV
9. Reports
10. Expenses
11. Settings (Apps Script URL configuration + setup guide)

## Google Sheets sheets (auto-created on first API call)
`ProductionLog`, `Inventory`, `Billing`, `PurchaseEntry`, `DeliveryChallan`, `StaffAttendance`, `CCTV`, `Reports`, `Expenses`, `Settings`.

## Key Files
- `/app/apps-script/Code.gs` — full Apps Script backend (paste into Sheet → Extensions → Apps Script)
- `/app/apps-script/README.md` — 3-minute deploy guide
- `/app/frontend/public/apps-script-code.gs` + `apps-script-readme.md` — downloadable copies linked from Settings page
- `/app/frontend/src/lib/sheets.js` — service layer (fetch to Apps Script)
- `/app/frontend/src/lib/modules.js` — declarative config for the 8 generic list modules (fields, stats, columns)
- `/app/frontend/src/pages/GenericModule.jsx` — reusable module page (stats + register table + add/edit dialog + CSV export + pagination + search)
- Billing pages (`BillingList.jsx`, `NewBill.jsx`, `InvoicePrint.jsx`) — retain 3-copy print + live total summary + auto-stock deduction via Sale transactions posted to Inventory sheet.

## User Personas
- Small manufacturing / wholesale business owner who wants an ERP but keeps all data in a Google Sheet they can view/edit anytime.

## Core Requirements
1. 11 menu components, each tied to a Google Sheet ✓
2. Bill menu with live total summary (Subtotal/CGST/SGST/Discount/Grand Total) ✓
3. Print 3 copies (Original / Duplicate / Triplicate) ✓
4. Auto stock deduction on invoice save ✓
5. Google Sheets as backend (via Apps Script Web App) ✓

## Implemented (Feb 2026)
- [x] 11-item sidebar (dark theme + orange accent, RapidTech look)
- [x] Setup gate + Settings page for Apps Script URL
- [x] Apps Script backend with generic CRUD + `createInvoice` (validates stock, deducts via Inventory `Sale` txn) + dashboard stats
- [x] Generic module page powering 8 modules from a declarative config
- [x] Billing with total summary + 3-copy print retained
- [x] Auto stock deduction: `createInvoice` in Apps Script appends `Sale` transactions to Inventory sheet, updating closing_stock
- [x] CSV export per module, search, pagination

## Backlog / Next Actions
- P1: **Test with a live Apps Script URL** (user must deploy the script and paste URL — cannot be tested end-to-end from this container without it)
- P1: Per-module bulk import from CSV
- P2: Emergent Google OAuth so each user connects their own sheet
- P2: Rate/HSN master sheet so NewBill auto-fills price + tax from product
- P2: PDF download of invoice (no browser print dialog)
- P3: Payment recording (Partial → Paid with date + method) written back to Billing sheet
- P3: Charts on Dashboard (monthly sales, production trends) using recharts
