import React from 'react';
import { History } from 'lucide-react';
import KycCard from './KycCard';

export default function KycTimeline({ timeline }) {
  const events = timeline || [];

  return (
    <KycCard title="Verification Timeline" icon={History}>
      {events.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">No activity recorded</p>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-2 top-1 bottom-1 w-px bg-slate-700" />
          {events.map((event, idx) => {
            const action = (event.action || '').toLowerCase();
            const outcome = (event.status || '').toLowerCase();
            const isNegative = action === 'reject' || outcome === 'failed' || outcome === 'rejected';
            const isPositive = !isNegative && (action === 'approve' || outcome === 'verified' || outcome === 'success');
            const when = event.date || event.createdAt;
            const who = event.officer || event.performedBy;
            return (
              <div key={event._id || idx} className="relative mb-4 last:mb-0">
                <div className={`absolute -left-[18px] top-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
                  isPositive ? 'bg-emerald-500' : isNegative ? 'bg-rose-500' : 'bg-amber-500'
                }`} />
                <p className="text-sm text-white">{event.description || event.action}</p>
                <p className="text-xs text-slate-500">{when ? new Date(when).toLocaleString() : '—'} {who ? `· ${who}` : ''}</p>
                {event.details && <p className="text-xs text-slate-400 mt-0.5">{event.details}</p>}
              </div>
            );
          })}
        </div>
      )}
    </KycCard>
  );
}