import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Settings2 } from 'lucide-react';
import { computeLiquidityRatio } from '@/lib/reportCalculations';
import { CBN_MIN_LIQUIDITY_RATIO, CBN_MIN_TBILL_SHARE_OF_DEPOSITS } from '@/lib/regulatoryConstants';
import { fmtMoney, fmtPct } from '@/lib/reportFormat';

const STORAGE_KEY = 'cbn_liquid_asset_gl_ids';
const DEFAULT_MATCH = /cash|bank|treasury|short[\s-]?term/i;

function loadSelection(assetRows) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    // fall through to heuristic default
  }
  return new Set(assetRows.filter(r => DEFAULT_MATCH.test(r.name)).map(r => r.id));
}

/**
 * Fineract's Asset GL type mixes genuinely liquid accounts (cash, bank
 * balances, treasury bills) with illiquid ones (loan receivables, fixed
 * assets). There's no reliable way to tell those apart automatically, so
 * the bank designates which Asset accounts count as "liquid" here — the
 * choice is persisted locally and reused every time this report runs.
 */
export default function LiquidityRatioSection({ balanceSheet, totalDepositLiabilities, asOfDate }) {
  const assetRows = balanceSheet.assets;
  const [selected, setSelected] = useState(() => loadSelection(assetRows));
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(selected)));
  }, [selected]);

  const liquidAssetsTotal = useMemo(
    () => assetRows.filter(r => selected.has(r.id)).reduce((s, r) => s + r.balance, 0),
    [assetRows, selected],
  );

  const ratio = computeLiquidityRatio(liquidAssetsTotal, totalDepositLiabilities);
  const meetsMinimum = ratio != null && ratio >= CBN_MIN_LIQUIDITY_RATIO;

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Liquidity Ratio</h2>
          <p className="text-xs text-slate-500 mt-0.5">As of {asOfDate} · minimum {fmtPct(CBN_MIN_LIQUIDITY_RATIO, 0)} of deposit liabilities, ≥{fmtPct(CBN_MIN_TBILL_SHARE_OF_DEPOSITS, 0)} in Treasury Bills</p>
        </div>
        <button
          onClick={() => setShowPicker(p => !p)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600/50"
        >
          <Settings2 className="w-3.5 h-3.5" /> {showPicker ? 'Hide' : 'Choose'} liquid asset accounts
        </button>
      </div>

      {showPicker && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-3">
            Select which Asset accounts count as liquid assets (cash, bank balances, Treasury Bills, short-term
            investments). Loan receivables and fixed assets should stay unchecked.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto">
            {assetRows.map(r => (
              <label key={r.id} className="flex items-center gap-2 text-sm text-slate-300 px-2 py-1 rounded hover:bg-slate-700/40 cursor-pointer">
                <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="rounded" />
                <span className="font-mono text-xs text-slate-500 w-16">{r.glCode}</span>
                <span className="truncate">{r.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className={`rounded-xl p-4 border ${meetsMinimum ? 'bg-emerald-600/10 border-emerald-600/30' : 'bg-rose-600/10 border-rose-600/30'}`}>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider mb-1 text-slate-400">
          Liquidity Ratio
          {meetsMinimum ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
        </div>
        <div className="text-2xl font-bold text-white">{fmtPct(ratio)}</div>
        <div className="text-xs text-slate-500 mt-1">
          Liquid assets {fmtMoney(liquidAssetsTotal)} ÷ deposit liabilities {fmtMoney(totalDepositLiabilities)}
        </div>
      </div>
    </div>
  );
}
