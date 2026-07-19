# BillBook — GST Billing & Inventory MVP

## Original Problem Statement
> "i need bill menu need to total summary and able to print three copies one is original copy and dublicate copy triplacte copy and auto dedect stcok form inventrit table"

## User Choices (confirmed via ask_human, defaults accepted)
- Fresh full-stack app: FastAPI + React + MongoDB
- GST invoice: Subtotal + CGST + SGST + Discount + Grand Total (INR)
- Print three copies (Original / Duplicate / Triplicate) on separate pages in one print job
- Auto-deduct stock on invoice save; warn on low stock
- Currency: INR, GST tax

## Architecture
- **Backend** (`/app/backend/server.py`): FastAPI + Motor (Mongo). Models: Product, Customer, Invoice with line items.
  - Endpoints: `/api/products`, `/api/customers`, `/api/invoices` (create decrements stock atomically; delete restores stock), `/api/dashboard/stats`, `/api/seed` (idempotent).
  - Amount-in-words in Indian numbering (Lakh/Crore).
- **Frontend** (`/app/frontend/src`): React + React Router + Shadcn UI + Tailwind. Sidebar layout with pages: Dashboard, Inventory, Customers, Billing List, New Bill, Invoice Print (opens in new tab, renders 3 copies with `@media print` page-break-after: always).

## User Personas
- Small retailer / wholesaler needing GST-compliant invoices with physical 3-copy printing and simple stock tracking.

## Core Requirements
1. Bill menu with live **Total Summary** (Subtotal, Discount, CGST, SGST, Grand Total)
2. Print **3 copies** (Original for Recipient / Duplicate for Transporter / Triplicate for Supplier)
3. **Auto-detect / auto-deduct stock** from inventory table on invoice save
4. Warn / block when quantity exceeds available stock

## Implemented (Feb 2026)
- [x] Product inventory CRUD with low-stock badges
- [x] Customer master (name, phone, GSTIN, address)
- [x] Invoice creation with line items, live Total Summary panel
- [x] Auto stock deduction on save + stock restore on invoice delete
- [x] Overstock warning banner + disabled save when overstocked
- [x] Printable 3-copy invoice (Original/Duplicate/Triplicate) with A4 print CSS
- [x] Dashboard: total sales, invoice count, pending amount, low-stock alerts, recent invoices
- [x] Amount in words (Indian numbering)
- [x] Seed data (6 products, 3 customers) on startup

## Backlog / Next Actions
- P1: Concurrency-safe invoice numbering (atomic counter in Mongo)
- P1: Edit invoice + payment recording (mark Partial → Paid, capture payment amount/date)
- P2: Downloadable PDF invoice (server-side reportlab or client html2pdf)
- P2: Purchases / stock-in workflow to increase inventory
- P2: Multi-tenant auth (owner login) — currently open
- P3: Reports: daily/monthly sales, top products, GST summary report
- P3: WhatsApp/SMS invoice sharing (Twilio)
