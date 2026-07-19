/**
 * RapidTech Business ERP — Google Apps Script Backend
 *
 * === DEPLOY INSTRUCTIONS ===
 * 1. Open the Google Sheet you want to use as the backend.
 * 2. Extensions → Apps Script.  Delete the default code.
 * 3. Paste this entire file. Save.
 * 4. Deploy → New deployment → Type: "Web app"
 *      • Execute as: "Me"
 *      • Who has access: "Anyone"
 *    Copy the /exec URL.
 * 5. In the ERP app open Settings and paste the URL.  Done.
 *
 * On first request the script auto-creates every required sheet
 * (ProductionLog, Inventory, Billing, PurchaseEntry, DeliveryChallan,
 *  StaffAttendance, CCTV, Reports, Expenses, Settings) with headers.
 */

const SHEETS = {
  ProductionLog: [
    'id', 'date', 'machine', 'operator', 'product', 'qty', 'waste', 'status', 'notes'
  ],
  Inventory: [
    'id', 'date', 'product_id', 'product_name', 'transaction_type',
    'quantity', 'unit', 'opening_stock', 'closing_stock', 'reference', 'remark', 'status'
  ],
  Billing: [
    'id', 'invoice_no', 'date', 'customer_name', 'customer_gstin', 'customer_phone',
    'customer_address', 'items_json', 'subtotal', 'discount', 'cgst_rate', 'sgst_rate',
    'cgst_amount', 'sgst_amount', 'grand_total', 'amount_in_words', 'payment_status', 'notes'
  ],
  PurchaseEntry: [
    'id', 'date', 'supplier', 'invoice_no', 'product', 'quantity', 'unit',
    'rate', 'amount', 'gst_amount', 'total', 'payment_status'
  ],
  DeliveryChallan: [
    'id', 'date', 'challan_no', 'customer', 'vehicle_no', 'product',
    'quantity', 'unit', 'destination', 'status'
  ],
  StaffAttendance: [
    'id', 'date', 'staff_name', 'role', 'check_in', 'check_out', 'hours', 'status'
  ],
  CCTV: [
    'id', 'camera_id', 'location', 'stream_url', 'status', 'last_checked'
  ],
  Reports: [
    'id', 'report_name', 'period', 'generated_on', 'generated_by', 'summary'
  ],
  Expenses: [
    'id', 'date', 'category', 'description', 'amount', 'paid_by', 'payment_mode', 'reference'
  ],
  Settings: [
    'id', 'key', 'value'
  ],
};

function _ss() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function _ensureSheet(name) {
  const ss = _ss();
  let sh = ss.getSheetByName(name);
  const headers = SHEETS[name];
  if (!headers) throw new Error('Unknown sheet: ' + name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  } else {
    const existing = sh.getRange(1, 1, 1, Math.max(headers.length, sh.getLastColumn())).getValues()[0];
    // Add missing headers
    headers.forEach((h, i) => {
      if (existing[i] !== h) {
        sh.getRange(1, i + 1).setValue(h).setFontWeight('bold');
      }
    });
  }
  return sh;
}

function _allSheets() {
  Object.keys(SHEETS).forEach(_ensureSheet);
}

function _uuid() {
  return Utilities.getUuid();
}

function _rowsToObjects(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  const out = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (row.every(c => c === '' || c === null)) continue;
    const obj = { _row: i + 1 };
    headers.forEach((h, j) => {
      let v = row[j];
      if (v instanceof Date) v = v.toISOString();
      obj[h] = v;
    });
    out.push(obj);
  }
  return out;
}

function _findRow(sheet, id) {
  const values = sheet.getDataRange().getValues();
  const idCol = values[0].indexOf('id');
  if (idCol < 0) return -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idCol]) === String(id)) return i + 1;
  }
  return -1;
}

function _list(sheetName) {
  const sh = _ensureSheet(sheetName);
  const rows = _rowsToObjects(sh);
  rows.forEach(r => delete r._row);
  return rows;
}

function _create(sheetName, data) {
  const sh = _ensureSheet(sheetName);
  const headers = SHEETS[sheetName];
  const record = Object.assign({}, data);
  if (!record.id) record.id = _uuid();
  const row = headers.map(h => record[h] === undefined ? '' : record[h]);
  sh.appendRow(row);
  return record;
}

function _update(sheetName, id, data) {
  const sh = _ensureSheet(sheetName);
  const rowNum = _findRow(sh, id);
  if (rowNum < 0) throw new Error('Record not found');
  const headers = SHEETS[sheetName];
  const current = sh.getRange(rowNum, 1, 1, headers.length).getValues()[0];
  const merged = {};
  headers.forEach((h, i) => merged[h] = current[i]);
  Object.assign(merged, data);
  merged.id = id;
  const row = headers.map(h => merged[h] === undefined ? '' : merged[h]);
  sh.getRange(rowNum, 1, 1, headers.length).setValues([row]);
  return merged;
}

function _delete(sheetName, id) {
  const sh = _ensureSheet(sheetName);
  const rowNum = _findRow(sh, id);
  if (rowNum < 0) throw new Error('Record not found');
  sh.deleteRow(rowNum);
  return { ok: true };
}

/* ---------------- Inventory-aware helpers ---------------- */

function _currentStock() {
  // Group Inventory rows by product_id, taking latest closing_stock by date
  const rows = _list('Inventory');
  const map = {};
  rows.sort((a, b) => new Date(a.date) - new Date(b.date));
  rows.forEach(r => {
    if (!r.product_id) return;
    map[r.product_id] = {
      product_id: r.product_id,
      product_name: r.product_name,
      unit: r.unit,
      stock: Number(r.closing_stock) || 0,
    };
  });
  return Object.values(map);
}

function _addInventoryTxn(txn) {
  // txn: {date, product_id, product_name, transaction_type, quantity, unit, reference, remark}
  const stockList = _currentStock();
  const current = stockList.find(s => s.product_id === txn.product_id);
  const opening = current ? current.stock : 0;
  let closing = opening;
  const q = Number(txn.quantity) || 0;
  if (txn.transaction_type === 'Sale' || txn.transaction_type === 'Waste') closing = opening - q;
  else closing = opening + q;

  return _create('Inventory', {
    date: txn.date || new Date().toISOString(),
    product_id: txn.product_id,
    product_name: txn.product_name,
    transaction_type: txn.transaction_type,
    quantity: q,
    unit: txn.unit || 'pcs',
    opening_stock: opening,
    closing_stock: closing,
    reference: txn.reference || '',
    remark: txn.remark || '',
    status: 'Completed',
  });
}

/* ---------------- Billing / Invoice ---------------- */

function _nextInvoiceNo() {
  const rows = _list('Billing');
  const yr = new Date().getFullYear().toString().slice(-2);
  const n = rows.length + 1;
  return 'INV-' + yr + '-' + String(n).padStart(5, '0');
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
  'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
  'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function _twoDigit(n) {
  if (n < 20) return ONES[n];
  return (TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '')).trim();
}

function _threeDigit(n) {
  let r = '';
  if (n >= 100) { r += ONES[Math.floor(n / 100)] + ' Hundred'; n = n % 100; if (n) r += ' '; }
  if (n) r += _twoDigit(n);
  return r;
}

function _numberToIndianWords(amount) {
  let rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let words = '';
  if (rupees === 0) words = 'Zero';
  else {
    const crore = Math.floor(rupees / 10000000); rupees %= 10000000;
    const lakh = Math.floor(rupees / 100000); rupees %= 100000;
    const thousand = Math.floor(rupees / 1000); rupees %= 1000;
    const parts = [];
    if (crore) parts.push(_twoDigit(crore) + ' Crore');
    if (lakh) parts.push(_twoDigit(lakh) + ' Lakh');
    if (thousand) parts.push(_twoDigit(thousand) + ' Thousand');
    if (rupees) parts.push(_threeDigit(rupees));
    words = parts.join(' ').trim();
  }
  let out = 'Rupees ' + words;
  if (paise) out += ' and ' + _twoDigit(paise) + ' Paise';
  return out + ' Only';
}

function _createInvoice(data) {
  // data: {customer_name, customer_gstin, customer_phone, customer_address,
  //        items: [{product_id, product_name, sku, hsn, price, quantity, unit}],
  //        cgst_rate, sgst_rate, discount, payment_status, notes, date }
  if (!data.items || !data.items.length) throw new Error('Invoice must have items');

  const stocks = _currentStock();
  data.items.forEach(it => {
    const s = stocks.find(x => x.product_id === it.product_id);
    if (!s) throw new Error('Product not found in inventory: ' + it.product_name);
    if (s.stock < Number(it.quantity)) {
      throw new Error('Insufficient stock for ' + it.product_name +
        ' (Available: ' + s.stock + ', Requested: ' + it.quantity + ')');
    }
  });

  let subtotal = 0;
  data.items.forEach(it => subtotal += Number(it.price) * Number(it.quantity));
  subtotal = Math.round(subtotal * 100) / 100;
  const discount = Number(data.discount) || 0;
  const taxable = Math.max(subtotal - discount, 0);
  const cgstRate = Number(data.cgst_rate) || 0;
  const sgstRate = Number(data.sgst_rate) || 0;
  const cgstAmount = Math.round(taxable * cgstRate) / 100;
  const sgstAmount = Math.round(taxable * sgstRate) / 100;
  const grandTotal = Math.round((taxable + cgstAmount + sgstAmount) * 100) / 100;

  const invoice = _create('Billing', {
    invoice_no: _nextInvoiceNo(),
    date: data.date || new Date().toISOString(),
    customer_name: data.customer_name || '',
    customer_gstin: data.customer_gstin || '',
    customer_phone: data.customer_phone || '',
    customer_address: data.customer_address || '',
    items_json: JSON.stringify(data.items),
    subtotal: subtotal,
    discount: discount,
    cgst_rate: cgstRate,
    sgst_rate: sgstRate,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    grand_total: grandTotal,
    amount_in_words: _numberToIndianWords(grandTotal),
    payment_status: data.payment_status || 'Pending',
    notes: data.notes || '',
  });

  // Auto-deduct stock via inventory transactions
  data.items.forEach(it => {
    _addInventoryTxn({
      date: new Date().toISOString(),
      product_id: it.product_id,
      product_name: it.product_name,
      transaction_type: 'Sale',
      quantity: it.quantity,
      unit: it.unit,
      reference: invoice.invoice_no,
      remark: 'Sale via ' + invoice.invoice_no,
    });
  });

  return invoice;
}

/* ---------------- Dashboard stats ---------------- */

function _dashboardStats() {
  const bills = _list('Billing');
  const inv = _list('Inventory');
  const exp = _list('Expenses');
  const prod = _list('ProductionLog');

  const totalSales = bills.reduce((s, b) => s + (Number(b.grand_total) || 0), 0);
  const pendingAmount = bills.filter(b => b.payment_status !== 'Paid')
    .reduce((s, b) => s + (Number(b.grand_total) || 0), 0);
  const totalExpense = exp.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalProduction = prod.reduce((s, p) => s + (Number(p.qty) || 0), 0);

  const stocks = _currentStock();
  const lowStock = stocks.filter(s => s.stock > 0 && s.stock <= 10);
  const outOfStock = stocks.filter(s => s.stock <= 0);
  const inventoryValue = 0; // no rate in inventory sheet by default

  return {
    total_sales: totalSales,
    total_invoices: bills.length,
    pending_amount: pendingAmount,
    total_expense: totalExpense,
    total_production: totalProduction,
    low_stock_count: lowStock.length,
    out_of_stock_count: outOfStock.length,
    inventory_products: stocks.length,
    low_stock_items: lowStock.slice(0, 10),
    recent_invoices: bills.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
  };
}

/* ---------------- HTTP handlers ---------------- */

function _json(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    _allSheets();
    const p = e.parameter || {};
    const action = p.action || 'ping';
    if (action === 'ping') return _json({ ok: true, service: 'RapidTech ERP', time: new Date().toISOString() });
    if (action === 'list') return _json({ ok: true, data: _list(p.sheet) });
    if (action === 'get') {
      const rows = _list(p.sheet);
      const row = rows.find(r => String(r.id) === String(p.id));
      return _json({ ok: !!row, data: row || null });
    }
    if (action === 'stock') return _json({ ok: true, data: _currentStock() });
    if (action === 'stats') return _json({ ok: true, data: _dashboardStats() });
    return _json({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return _json({ ok: false, error: err && err.message ? err.message : String(err) });
  }
}

function doPost(e) {
  try {
    _allSheets();
    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action;
    if (action === 'create') return _json({ ok: true, data: _create(body.sheet, body.data || {}) });
    if (action === 'update') return _json({ ok: true, data: _update(body.sheet, body.id, body.data || {}) });
    if (action === 'delete') return _json({ ok: true, data: _delete(body.sheet, body.id) });
    if (action === 'inventoryTxn') return _json({ ok: true, data: _addInventoryTxn(body.data || {}) });
    if (action === 'createInvoice') return _json({ ok: true, data: _createInvoice(body.data || {}) });
    return _json({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return _json({ ok: false, error: err && err.message ? err.message : String(err) });
  }
}
