// Google Apps Script service layer
const URL_KEY = "rapidtech_sheets_url";

// நிரந்தரமான URL-ஐ இங்கே பதிவிடவும்
const PERMANENT_URL = "https://script.google.com/macros/s/AKfycbwhLg8cnSYx9uMD7UFsImlmIGSZEN4U19gg7VMJbSZZzgtyBLaH3vDqGqrtYhFyNjji/exec";

export const getSheetsUrl = () => {
  // எப்போதும் நிரந்தரமான URL-ஐயே திருப்பி அனுப்பும்
  return PERMANENT_URL;
};

export const setSheetsUrl = (url) => {
  // இந்த செயல்பாடு இனி தேவையில்லை, ஆனால் பிழை வராமல் இருக்க இப்படி விடலாம்
  localStorage.setItem(URL_KEY, url.trim());
};
const _post = async (payload) => {
  const url = getSheetsUrl();
  if (!url) throw new Error("Google Sheets URL not configured. Go to Settings.");
  const res = await fetch(url, {
    method: "POST",
    // text/plain avoids CORS preflight for Apps Script
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
    redirect: "follow",
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Request failed");
  return json.data;
};

const _get = async (params) => {
  const url = getSheetsUrl();
  if (!url) throw new Error("Google Sheets URL not configured. Go to Settings.");
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${url}?${qs}`, { method: "GET", redirect: "follow" });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Request failed");
  return json.data;
};

export const sheets = {
  ping: () => _get({ action: "ping" }),
  list: (sheet) => _get({ action: "list", sheet }),
  get: (sheet, id) => _get({ action: "get", sheet, id }),
  stock: () => _get({ action: "stock" }),
  stats: () => _get({ action: "stats" }),
  create: (sheet, data) => _post({ action: "create", sheet, data }),
  update: (sheet, id, data) => _post({ action: "update", sheet, id, data }),
  remove: (sheet, id) => _post({ action: "delete", sheet, id }),
  // lib/sheets.js கோப்பில்:
  addInventoryTxn: (data) => _post({ action: "addInventoryTxn", data }), // இங்கே "addInventoryTxn" என மாற்றவும்
  createInvoice: (data) => _post({ action: "createInvoice", data }),
};

export const formatINR = (v) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(v || 0));

export const formatDate = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return iso;
  }
};
