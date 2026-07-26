import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import { FileText, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ExportToolbar from '@/components/fineract/accounting/ExportToolbar';
import { useToast } from '@/components/ui/use-toast';

/**
 * Normalizes the two response shapes Fineract's /runreports/{reportName}
 * can return: a plain array of row objects, or the generic
 * { columnHeaders: [...], data: [{ row: [...] }] } grid shape.
 */
function normalizeReportRows(res) {
  if (Array.isArray(res)) {
    if (res.length === 0) return { columns: [], rows: [] };
    const columns = Object.keys(res[0]);
    return { columns, rows: res };
  }
  if (res?.columnHeaders && res?.data) {
    const columns = res.columnHeaders.map(c => c.columnName);
    const rows = res.data.map(d => {
      const row = {};
      columns.forEach((c, i) => { row[c] = d.row?.[i]; });
      return row;
    });
    return { columns, rows };
  }
  return { columns: [], rows: [] };
}

export default function FineractReportExplorer() {
  const { toast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState(null);
  const [paramDefs, setParamDefs] = useState([]);
  const [paramValues, setParamValues] = useState({});
  const [loadingParams, setLoadingParams] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fineractApi('/reports');
      setReports(Array.isArray(res) ? res : []);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openReport = async (r) => {
    setActiveReport(r);
    setResults(null);
    setLoadingParams(true);
    try {
      const detail = await fineractApi(`/reports/${r.id}`);
      const defs = detail?.reportParameters || [];
      setParamDefs(defs);
      // "...SelectAll" parameters are Fineract's own convention for an office/staff/loan
      // officer filter — leaving them unset (rather than "-1" for "All") sends nothing
      // for that SQL placeholder and Fineract throws a raw JDBC exception instead of a
      // useful error. Pre-fill the conventional defaults so a bare "Run" click works.
      const defaults = {};
      defs.forEach(p => {
        if (/selectall/i.test(p.reportParameterName)) defaults[p.reportParameterName] = '-1';
        else if (/date/i.test(p.reportParameterName)) defaults[p.reportParameterName] = new Date().toISOString().split('T')[0];
      });
      setParamValues(defaults);
    } catch {
      setParamDefs([]);
      setParamValues({});
    } finally {
      setLoadingParams(false);
    }
  };

  const closeDialog = () => {
    setActiveReport(null);
    setResults(null);
    setParamDefs([]);
  };

  const runReport = async () => {
    if (!activeReport) return;
    setRunning(true);
    try {
      const params = {};
      Object.entries(paramValues).forEach(([k, v]) => { if (v !== '') params[k] = v; });
      const res = await fineractApi(`/runreports/${encodeURIComponent(activeReport.reportName)}`, { params });
      setResults(normalizeReportRows(res));
    } catch (err) {
      toast({ title: 'Error running report', description: err.message, variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  };

  const exportColumns = results ? results.columns.map(c => ({ label: c, key: c })) : [];

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Every report registered in Fineract's Report Management module (System &rarr; Manage Reports), run directly
        against the live data and rendered/exported here — no separate report viewer needed.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>
        ) : reports.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-500 text-sm">
            No reports are registered in Fineract yet. Reports created via <code className="text-slate-400">POST /reports</code> (System &rarr; Manage Reports) will appear here automatically.
          </div>
        ) : reports.map(r => (
          <div key={r.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[10px] text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-700/50">{r.reportType}</span>
            </div>
            <h3 className="text-sm font-semibold text-white">{r.reportName}</h3>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.reportDescription || 'No description'}</p>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={() => openReport(r)} className="bg-emerald-600 hover:bg-emerald-700 flex-1">
                <Play className="w-3.5 h-3.5 mr-1" /> Run
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!activeReport} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{activeReport?.reportName}</DialogTitle></DialogHeader>

          {loadingParams ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-emerald-400" /></div>
          ) : (
            <div className="space-y-4">
              {paramDefs.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paramDefs.map(p => (
                    <div key={p.id}>
                      <Label className="text-slate-300 text-xs">{p.reportParameterName}</Label>
                      <Input
                        type={/date/i.test(p.reportParameterName) ? 'date' : 'text'}
                        value={paramValues[p.reportParameterName] || ''}
                        onChange={e => setParamValues(v => ({ ...v, [p.reportParameterName]: e.target.value }))}
                        className="mt-1 bg-slate-800 border-slate-700 text-white"
                      />
                      {/selectall/i.test(p.reportParameterName) && (
                        <p className="text-[10px] text-slate-500 mt-1">-1 means "All" — this parameter filters by ID</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <Button onClick={runReport} disabled={running} className="bg-emerald-600 hover:bg-emerald-700">
                  {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />} Run Report
                </Button>
                {results && results.rows.length > 0 && (
                  <ExportToolbar filename={activeReport?.reportName?.replace(/\s+/g, '_') || 'report'} title={activeReport?.reportName} columns={exportColumns} data={results.rows} />
                )}
              </div>

              {results && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                  {results.rows.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">Report ran successfully but returned no rows</div>
                  ) : (
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-900/50 sticky top-0">
                          <tr>
                            {results.columns.map(c => (
                              <th key={c} className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                          {results.rows.map((row, i) => (
                            <tr key={i}>
                              {results.columns.map(c => (
                                <td key={c} className="px-3 py-2 text-slate-300 whitespace-nowrap">{String(row[c] ?? '—')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
