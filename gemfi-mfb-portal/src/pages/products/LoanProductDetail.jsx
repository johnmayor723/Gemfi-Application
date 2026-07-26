import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fineractApi } from '@/lib/fineract';
import { ArrowLeft, Loader2, Edit, Calendar, DollarSign, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/fineract/PageHeader';
import { useToast } from '@/components/ui/use-toast';

export default function LoanProductDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const p = await fineractApi(`/loanproducts/${id}`);
      setProduct(p);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>;
  if (!product) return <div className="p-8 text-center text-slate-500">Product not found</div>;

  const Field = ({ label, value }) => (
    <div><dt className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</dt><dd className="text-sm text-white mt-1">{value ?? '—'}</dd></div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <Link to="/products/loan" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Loan Products
      </Link>
      <PageHeader title={product.name} description={product.description || `Short name: ${product.shortName}`}
        action={<Button onClick={() => window.location.href = `/products/loan/${id}/edit`} variant="outline" className="border-slate-600 text-slate-300"><Edit className="w-4 h-4 mr-2" /> Edit Product</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Principal & Currency</h2>
          <dl className="grid grid-cols-2 gap-4">
            <Field label="Currency" value={product.currency?.displayLabel} />
            <Field label="Principal" value={product.principal?.toLocaleString()} />
            <Field label="Min Principal" value={product.minPrincipal?.toLocaleString()} />
            <Field label="Max Principal" value={product.maxPrincipal?.toLocaleString()} />
          </dl>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Interest & Repayment</h2>
          <dl className="grid grid-cols-2 gap-4">
            <Field label="Interest Rate" value={`${product.interestRatePerPeriod}%`} />
            <Field label="Min Interest" value={product.minInterestRatePerPeriod != null ? `${product.minInterestRatePerPeriod}%` : '—'} />
            <Field label="# Repayments" value={product.numberOfRepayments} />
            <Field label="Repayment Every" value={`${product.repaymentEvery} ${product.repaymentFrequencyType?.value || ''}`} />
            <Field label="Loan Term" value={`${product.loanTermFrequency} ${product.loanTermFrequencyType?.value || ''}`} />
            <Field label="Amortization" value={product.amortizationType?.value} />
            <Field label="Interest Type" value={product.interestType?.value} />
            <Field label="Strategy" value={product.transactionProcessingStrategy?.name || product.transactionProcessingStrategyCode} />
          </dl>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Accounting</h2>
          <dl className="grid grid-cols-2 gap-4">
            <Field label="Accounting Rule" value={(() => {
              const ar = product.accountingRule;
              if (typeof ar === 'object') return ar?.value || '—';
              return { 1: 'None', 2: 'Cash', 3: 'Accrual' }[ar] || '—';
            })()} />
            <Field label="Tax with Accounting" value={product.withTaxCoverage ? 'Yes' : 'No'} />
          </dl>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Dates</h2>
          <dl className="grid grid-cols-2 gap-4">
            <Field label="Start Date" value={product.startDate?.join('-')} />
            <Field label="Close Date" value={product.closeDate?.join('-') || '—'} />
          </dl>
        </div>
      </div>
    </div>
  );
}