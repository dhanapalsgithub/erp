import { useEffect, useState } from "react";
import { MODULES } from "@/lib/modules";
import { sheets, formatDate, formatINR } from "@/lib/sheets";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Download, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const badgeCls = (val) => {
  const v = String(val || "").toLowerCase();
  if (["completed", "paid", "delivered", "online", "present"].includes(v))
    return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
  if (["pending", "in progress", "in transit", "half day", "maintenance", "partial"].includes(v))
    return "bg-amber-100 text-amber-700 hover:bg-amber-100";
  if (["on hold", "absent", "offline", "returned", "leave"].includes(v))
    return "bg-red-100 text-red-700 hover:bg-red-100";
  return "bg-slate-100 text-slate-700 hover:bg-slate-100";
};

const toCSV = (rows, columns) => {
  const header = columns.map((c) => c.label).join(",");
  const body = rows
    .map((r) => columns.map((c) => `"${String(r[c.key] ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  return header + "\n" + body;
};

export default function GenericModule({ moduleKey }) {
  const cfg = MODULES[moduleKey];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = async () => {
    setLoading(true);
    try {
      const data = await sheets.list(cfg.sheet);
      setRows(data);
    } catch (e) {
      toast.error(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setPage(1);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleKey]);

  const openCreate = () => {
    const initial = {};
    cfg.fields.forEach((f) => (initial[f.key] = f.default ?? ""));
    if (cfg.fields.some((f) => f.key === "date"))
      initial.date = new Date().toISOString().slice(0, 10);
    setForm(initial);
    setEditId(null);
    setOpen(true);
  };

  const openEdit = (row) => {
    const data = {};
    cfg.fields.forEach((f) => {
      let v = row[f.key] ?? "";
      if (f.type === "date" && v) {
        try {
          v = new Date(v).toISOString().slice(0, 10);
        } catch {
          /* noop */
        }
      }
      data[f.key] = v;
    });
    setForm(data);
    setEditId(row.id);
    setOpen(true);
  };

  const submit = async () => {
    for (const f of cfg.fields) {
      if (f.required && !form[f.key]) {
        toast.error(`${f.label} is required`);
        return;
      }
    }
    setSaving(true);
    try {
      if (editId) {
        await sheets.update(cfg.sheet, editId, form);
        toast.success("Updated");
      } else {
        await sheets.create(cfg.sheet, form);
        toast.success("Added");
      }
      setOpen(false);
      load();
    } catch (e) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await sheets.remove(cfg.sheet, id);
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(e.message || "Delete failed");
    }
  };

  const exportCSV = () => {
    const csv = toCSV(rows, cfg.columns);
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${cfg.sheet}.csv`;
    a.click();
  };

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const t = q.toLowerCase();
    return cfg.columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(t));
  });
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const stats = cfg.stats ? cfg.stats(rows) : [];

  const renderCell = (row, col) => {
    let v = row[col.key];
    if (col.format === "date" && v) {
      try { v = formatDate(v); } catch { /* noop */ }
    }
    if (col.format === "currency") v = formatINR(v);
    if (col.badge) {
      return (
        <Badge className={badgeCls(v)}>{v || "-"}</Badge>
      );
    }
    return v === "" || v === null || v === undefined ? "-" : String(v);
  };

  return (
    <div className="space-y-6" data-testid={`${moduleKey.toLowerCase()}-page`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-orange-600 text-xs uppercase tracking-widest font-semibold">
            Overview
          </div>
          <h1 className="font-display text-3xl font-semibold">{cfg.label}</h1>
          <p className="text-slate-600 mt-1 text-sm">{cfg.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCSV} data-testid={`${moduleKey.toLowerCase()}-export-btn`}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button
            onClick={openCreate}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            data-testid={`${moduleKey.toLowerCase()}-add-btn`}
          >
            <Plus className="h-4 w-4 mr-1" /> Add New
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      {stats.length > 0 && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(4, stats.length)} gap-4`}>
          {stats.map((s, i) => (
            <Card key={i} className="shadow-sm border border-slate-200">
              <CardContent className="p-5">
                <div className="text-xs uppercase tracking-wide text-slate-500">{s.label}</div>
                <div className={`mt-2 font-display text-2xl font-semibold tabular ${
                  s.tone === "warning" ? "text-orange-600"
                  : s.tone === "success" ? "text-emerald-600"
                  : "text-slate-900"
                }`}>
                  {s.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Register table */}
      <Card className="shadow-sm border border-slate-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="font-display text-lg font-semibold">{cfg.label} Register</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  data-testid={`${moduleKey.toLowerCase()}-search`}
                  className="pl-9 w-64"
                  placeholder={`Search ${cfg.label.toLowerCase()}`}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid={`${moduleKey.toLowerCase()}-table`}>
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-500 uppercase text-[11px] tracking-wider">
                  {cfg.columns.map((c) => (
                    <th key={c.key} className={`py-3 px-3 ${c.align === "right" ? "text-right" : ""}`}>
                      {c.label}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={cfg.columns.length + 1} className="py-8 text-center text-slate-500">Loading...</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={cfg.columns.length + 1} className="py-8 text-center text-slate-500">No records yet. Click "Add New".</td></tr>
                ) : (
                  paged.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                      {cfg.columns.map((c) => (
                        <td key={c.key} className={`py-3 px-3 ${c.align === "right" ? "text-right tabular" : ""}`}>
                          {renderCell(r, c)}
                        </td>
                      ))}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => remove(r.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
              <div>
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} records
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</Button>
                <span className="bg-orange-500 text-white h-8 w-8 flex items-center justify-center rounded text-xs font-semibold">
                  {page}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit" : "Add"} {cfg.label}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cfg.fields.map((f) => (
              <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                <Label>{f.label}{f.required && <span className="text-red-500 ml-1">*</span>}</Label>
                {f.type === "textarea" ? (
                  <Textarea
                    value={form[f.key] || ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                ) : f.type === "select" ? (
                  <Select
                    value={form[f.key] || ""}
                    onValueChange={(v) => setForm({ ...form, [f.key]: v })}
                  >
                    <SelectTrigger data-testid={`field-${f.key}`}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    placeholder={f.placeholder}
                    value={form[f.key] || ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    data-testid={`field-${f.key}`}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={submit}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              data-testid="save-record-btn"
            >
              {saving ? "Saving..." : editId ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
