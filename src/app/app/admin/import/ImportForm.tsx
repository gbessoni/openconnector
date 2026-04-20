"use client";

import { useState } from "react";
import { bulkImportLeadsAction } from "../../actions";

interface User {
  id: number;
  name: string;
  email: string;
}

const ALLOWED_HEADERS = [
  "lead_name",
  "lead_email",
  "lead_linkedin",
  "company",
  "company_website",
  "title",
  "vendor",
  "category",
  "why_fit",
  "notes",
  "status",
  "owner_email",
];

export function ImportForm({ users }: { users: User[] }) {
  const [csv, setCsv] = useState("");
  const [defaultOwnerId, setDefaultOwnerId] = useState<number>(users[0]?.id ?? 0);
  const [parsed, setParsed] = useState<Record<string, string>[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [loading, setLoading] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsv(String(reader.result || ""));
    };
    reader.readAsText(file);
  }

  function parseCSV() {
    setError(null);
    setResult(null);
    const lines = csv.trim().split(/\r?\n/);
    if (lines.length < 2) {
      setError("CSV must have a header row and at least one data row");
      return;
    }
    const rawHeaders = splitCSVLine(lines[0]).map((h) =>
      h.trim().toLowerCase().replace(/\s+/g, "_")
    );
    const unknown = rawHeaders.filter(
      (h) => h && !ALLOWED_HEADERS.includes(h)
    );
    if (unknown.length) {
      setError(
        `Unknown columns: ${unknown.join(", ")}. Allowed: ${ALLOWED_HEADERS.join(", ")}`
      );
      return;
    }
    if (!rawHeaders.includes("lead_name") || !rawHeaders.includes("company")) {
      setError("CSV must include lead_name and company columns");
      return;
    }

    const rows = lines.slice(1).map((line) => {
      const cells = splitCSVLine(line);
      const row: Record<string, string> = {};
      rawHeaders.forEach((h, i) => {
        row[h] = (cells[i] ?? "").trim();
      });
      return row;
    }).filter((r) => r.lead_name && r.company);

    setHeaders(rawHeaders);
    setParsed(rows);
  }

  async function handleImport() {
    if (!parsed) return;
    setError(null);
    setResult(null);
    setLoading(true);
    const fd = new FormData();
    fd.set("rows", JSON.stringify(parsed));
    fd.set("default_owner_id", String(defaultOwnerId));
    const res = await bulkImportLeadsAction(fd);
    setLoading(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    if (res?.inserted !== undefined) {
      setResult({ inserted: res.inserted, skipped: res.skipped });
      setCsv("");
      setParsed(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Owner + file */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Default owner
          </label>
          <select
            value={defaultOwnerId}
            onChange={(e) => setDefaultOwnerId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Used for rows without an owner_email column.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Upload CSV
          </label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />
        </div>
      </div>

      {/* Paste */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Or paste CSV
        </label>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={8}
          placeholder="lead_name,company,title,vendor,notes&#10;Jane Smith,Acme Co,CFO,Ramp,Intro'd via mutual"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={parseCSV}
          disabled={!csv.trim()}
          className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-40 transition-colors"
        >
          Preview
        </button>
        {parsed && parsed.length > 0 && (
          <button
            type="button"
            onClick={handleImport}
            disabled={loading}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors"
          >
            {loading ? "Importing..." : `Import ${parsed.length} leads`}
          </button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {result && (
        <div className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Imported <strong>{result.inserted}</strong> leads.{" "}
          {result.skipped > 0 && `${result.skipped} rows skipped.`}
        </div>
      )}

      {parsed && parsed.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider font-medium">
            Preview ({parsed.length} rows)
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 sticky top-0">
                <tr>
                  {headers.map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2 font-medium whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parsed.slice(0, 50).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {headers.map((h) => (
                      <td
                        key={h}
                        className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-xs truncate"
                      >
                        {row[h] || <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsed.length > 50 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              Showing first 50 of {parsed.length} rows. All will be imported.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Minimal CSV line splitter that handles quoted fields with commas
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        current += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        result.push(current);
        current = "";
      } else {
        current += c;
      }
    }
  }
  result.push(current);
  return result;
}
