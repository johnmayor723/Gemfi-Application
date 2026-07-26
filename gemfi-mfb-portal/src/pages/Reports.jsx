import React, { useState } from 'react';
import { Loader2, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PageHeader from '@/components/fineract/PageHeader';
import CBNReturns from '@/components/fineract/reports/CBNReturns';
import NDICReturns from '@/components/fineract/reports/NDICReturns';
import IncomeStatementSection from '@/components/fineract/reports/IncomeStatementSection';
import ReconciliationReport from '@/components/fineract/reports/ReconciliationReport';
import FineractReportExplorer from '@/components/fineract/reports/FineractReportExplorer';
import { useReportingData } from '@/hooks/useReportingData';
import { todayISO } from '@/lib/reportFormat';

const inputCls = 'h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-600';

function EmptyState({ loading }) {
  if (loading) return null;
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center text-slate-500 text-sm">
      Click "Generate Reports" above to build this report from live data.
    </div>
  );
}

export default function Reports() {
  const [asOfDate, setAsOfDate] = useState(todayISO());
  const [tab, setTab] = useState('cbn');
  const { data, loading, progress, error, generate } = useReportingData();

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Reports"
        description="Regulatory returns and financial reports, generated on demand from live Fineract data"
      />

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">As of Date</label>
          <input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} className={inputCls} />
        </div>
        <Button onClick={() => generate(asOfDate)} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
          {loading ? 'Generating…' : data ? 'Regenerate' : 'Generate Reports'}
        </Button>
        {loading && progress && (
          <span className="text-xs text-slate-400">
            {progress.stage}: {progress.loaded.toLocaleString()}{progress.total ? ` / ${progress.total.toLocaleString()}` : ''}
          </span>
        )}
        {data && !loading && (
          <span className="text-xs text-slate-500">Generated {new Date(data.generatedAt).toLocaleString()}</span>
        )}
        {error && <span className="text-xs text-rose-400">{error}</span>}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 flex-wrap h-auto mb-5">
          <TabsTrigger value="cbn" className="text-xs">CBN Returns</TabsTrigger>
          <TabsTrigger value="ndic" className="text-xs">NDIC Returns</TabsTrigger>
          <TabsTrigger value="income" className="text-xs">Profit &amp; Income Statement</TabsTrigger>
          <TabsTrigger value="reconciliation" className="text-xs">Reconciliation</TabsTrigger>
          <TabsTrigger value="fineract" className="text-xs">Fineract Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="cbn">
          {data ? (
            <CBNReturns
              glAccounts={data.glAccounts}
              journalEntries={data.journalEntries}
              activeLoans={data.activeLoans}
              savingsAccounts={data.savingsAccounts}
              asOfDate={data.asOfDate}
            />
          ) : <EmptyState loading={loading} />}
        </TabsContent>

        <TabsContent value="ndic">
          {data ? (
            <NDICReturns savingsAccounts={data.savingsAccounts} asOfDate={data.asOfDate} />
          ) : <EmptyState loading={loading} />}
        </TabsContent>

        <TabsContent value="income">
          {data ? (
            <IncomeStatementSection
              glAccounts={data.glAccounts}
              journalEntries={data.journalEntries}
              defaultToDate={data.asOfDate}
            />
          ) : <EmptyState loading={loading} />}
        </TabsContent>

        <TabsContent value="reconciliation">
          {data ? (
            <ReconciliationReport
              glAccounts={data.glAccounts}
              journalEntries={data.journalEntries}
              asOfDate={data.asOfDate}
            />
          ) : <EmptyState loading={loading} />}
        </TabsContent>

        <TabsContent value="fineract">
          <FineractReportExplorer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
