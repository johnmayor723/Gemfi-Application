import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AuditTable from '@/components/fineract/audit/AuditTable';
import { fetchAudits, parseAuditResponse } from '@/lib/auditApi';
import { useToast } from '@/components/ui/use-toast';

const PAGE_SIZE = 10;

export default function AuditHistoryTab({ entityName, resourceId }) {
  const { toast } = useToast();
  const [audits, setAudits] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAudits({ entityName, resourceId, offset: page * PAGE_SIZE, limit: PAGE_SIZE });
      const { items, total: t } = parseAuditResponse(res);
      setAudits(items);
      setTotal(t);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [entityName, resourceId, page]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <AuditTable audits={audits} loading={loading} />
      </div>
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-slate-500">Page {page + 1} of {totalPages} · {total} records</span>
          <div className="flex gap-2">
            <button disabled={page === 0 || loading} onClick={() => setPage(p => Math.max(0, p - 1))} className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button disabled={page >= totalPages - 1 || loading} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}