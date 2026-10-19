'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getStoredToken } from '@/lib/api';
import { ImportJob } from '@/lib/types';
import { FileSpreadsheet, Download, Upload, CheckCircle2, AlertCircle, RefreshCw, X, Info } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  SUCCESS: 'bg-emerald-50 text-emerald-700',
  PARTIAL: 'bg-amber-50 text-amber-700',
  FAILED: 'bg-rose-50 text-rose-700',
  PENDING: 'bg-blue-50 text-blue-700',
};

export default function ImportsPage() {
  const router = useRouter();
  const [history, setHistory] = useState<ImportJob[]>([]);
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importResult, setImportResult] = useState<any>(null);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const h = await api.getImportHistory();
      setHistory(h);
    } catch (err) { console.error(err); }
    finally { setHistoryLoading(false); }
  };

  useEffect(() => {
    if (!getStoredToken()) { router.push('/login'); return; }
    loadHistory();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setCsvContent(ev.target?.result as string || '');
    reader.readAsText(file);
    setError('');
    setSuccess('');
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!csvContent.trim()) { setError('Please select a CSV file first.'); return; }
    setError(''); setSuccess(''); setImportResult(null);
    setLoading(true);
    try {
      const res = await api.importProductsCsv(csvContent, fileName || 'products.csv');
      setImportResult(res);
      if (res.failed === 0) {
        setSuccess(`✅ Import complete! ${res.imported} products imported successfully.`);
      } else {
        setSuccess(`⚠️ Import completed with issues: ${res.imported} imported, ${res.failed} failed.`);
      }
      setCsvContent('');
      setFileName('');
      loadHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const url = await api.getImportTemplateUrl();
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" /> CSV Product Import
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Bulk import products from a CSV spreadsheet</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-sm flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Import Workflow</p>
          <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
            <li>Download the CSV template using the button below.</li>
            <li>Fill in your product data following the column headers exactly.</li>
            <li>Upload the filled CSV file and click Import.</li>
            <li>Review results — errors will be shown for invalid rows.</li>
          </ol>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        {/* Step 1: Download template */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Step 1 — Download Template</h2>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-indigo-200 text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-all"
          >
            <Download className="w-4 h-4" /> Download CSV Template
          </button>
        </div>

        {/* Step 2: Upload */}
        <div className="border-t border-slate-100 pt-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Step 2 — Upload Filled CSV</h2>
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-indigo-300 transition-colors">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm mb-3">Drag & drop your CSV file here, or click to browse</p>
            <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md transition-all active:scale-95">
              <Upload className="w-4 h-4" /> Choose CSV File
              <input type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          {fileName && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              <span className="font-medium">{fileName}</span>
              <button onClick={() => { setCsvContent(''); setFileName(''); }} className="ml-auto text-slate-400 hover:text-rose-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Step 3: Import */}
        <div className="border-t border-slate-100 pt-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Step 3 — Run Import</h2>

          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{success}</div>
            </div>
          )}

          {importResult?.errors?.length > 0 && (
            <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm">
              <p className="font-semibold text-amber-800 mb-2">Rows with errors ({importResult.errors.length}):</p>
              <div className="max-h-48 overflow-y-auto thin-scroll space-y-1">
                {importResult.errors.map((err: any, i: number) => (
                  <div key={i} className="text-xs text-amber-700">
                    Row {err.row}: {Array.isArray(err.errors) ? err.errors.join(', ') : JSON.stringify(err.errors)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            id="import-btn"
            onClick={handleImport}
            disabled={loading || !csvContent}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all active:scale-95"
          >
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Importing…</>
              : <><CheckCircle2 className="w-4 h-4" /> Import Products</>
            }
          </button>
        </div>
      </div>

      {/* Import History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Import History</h2>
          <button onClick={loadHistory} disabled={historyLoading}
            className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
            <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {history.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-400 text-sm">No import jobs yet.</div>
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-3 text-left font-semibold">File Name</th>
                  <th className="px-5 py-3 text-right font-semibold">Total</th>
                  <th className="px-5 py-3 text-right font-semibold">Imported</th>
                  <th className="px-5 py-3 text-right font-semibold">Failed</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-700">{job.fileName}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{job.totalRows}</td>
                    <td className="px-5 py-3 text-right text-emerald-700 font-semibold">{job.importedRows}</td>
                    <td className="px-5 py-3 text-right text-rose-600 font-semibold">{job.failedRows}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_STYLES[job.status] ?? ''}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {new Date(job.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
