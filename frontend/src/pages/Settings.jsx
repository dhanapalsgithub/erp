import { useEffect, useState } from "react";
import { getSheetsUrl, setSheetsUrl, sheets } from "@/lib/sheets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";

export default function Settings() {
  const [url, setUrl] = useState(getSheetsUrl());
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const stored = getSheetsUrl();
    if (stored) {
      sheets.ping().then(() => setConnected(true)).catch(() => setConnected(false));
    }
  }, []);

  const testAndSave = async () => {
    if (!url || !url.includes("script.google.com")) {
      toast.error("Please paste a valid Google Apps Script /exec URL");
      return;
    }
    setTesting(true);
    try {
      setSheetsUrl(url.trim());
      await sheets.ping();
      setConnected(true);
      toast.success("Connected to Google Sheets!");
    } catch (e) {
      setConnected(false);
      toast.error("Failed to connect: " + (e.message || "unknown error"));
    } finally {
      setTesting(false);
    }
  };

  const disconnect = () => {
    setSheetsUrl("");
    setUrl("");
    setConnected(false);
    toast.info("Disconnected");
  };

  const steps = [
    "Create a new Google Sheet (sheets.google.com → Blank)",
    "Open Extensions → Apps Script",
    "Paste the entire Code.gs script (see /app/apps-script/Code.gs)",
    "Deploy → New deployment → Web app (Execute as: Me, Access: Anyone)",
    "Copy the /exec URL and paste it below",
  ];

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <div className="text-orange-600 text-xs uppercase tracking-widest font-semibold">Overview</div>
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <p className="text-slate-600 mt-1 text-sm">
          Configure the Google Sheets Apps Script Web App backend.
        </p>
      </div>

      <Card className="shadow-sm border border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            {connected ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-emerald-600 font-semibold">Connected</span>
              </>
            ) : (
              <>
                <Circle className="h-5 w-5 text-slate-400" />
                <span className="text-slate-500 font-semibold">Not Connected</span>
              </>
            )}
          </div>

          <Label>Google Apps Script Web App URL</Label>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Input
              value={url}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              onChange={(e) => setUrl(e.target.value)}
              data-testid="sheets-url-input"
              className="flex-1"
            />
            <Button
              onClick={testAndSave}
              disabled={testing}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              data-testid="save-connect-btn"
            >
              {testing ? "Connecting..." : "Save & Connect"}
            </Button>
            {connected && (
              <Button variant="outline" onClick={disconnect} data-testid="disconnect-btn">
                Disconnect
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Ends with <code className="bg-slate-100 px-1 rounded">/exec</code>. Redeploy the
            Apps Script whenever you change it.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border border-slate-200">
        <CardContent className="p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Setup Guide (3 minutes)</h3>
          <ol className="space-y-3 text-sm">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="h-6 w-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-slate-700 pt-0.5">{s}</span>
              </li>
            ))}
          </ol>

          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-md text-sm">
            <div className="font-semibold mb-2">Files in this project:</div>
            <ul className="space-y-1 text-slate-600">
              <li>
                <a
                  href="/apps-script-code.gs"
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-600 hover:underline inline-flex items-center gap-1"
                  data-testid="download-script-link"
                >
                  Code.gs <ExternalLink className="h-3 w-3" />
                </a>{" "}
                — Apps Script code to paste
              </li>
              <li>
                <a
                  href="/apps-script-readme.md"
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-600 hover:underline inline-flex items-center gap-1"
                >
                  README.md <ExternalLink className="h-3 w-3" />
                </a>{" "}
                — Full setup instructions
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
