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
          {events.map((event, idx) => (
            <div key={idx} className="relative mb-4 last:mb-0">
              <div className={`absolute -left-[18px] top-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
                event.status === 'verified' || event.status === 'success' ? 'bg-emerald-500' :
                event.status === 'failed' || event.status === 'rejected' ? 'bg-rose-500' :
                'bg-amber-500'
              }`} />
              <p className="text-sm text-white">{event.action || event.description}</p>
              <p className="text-xs text-slate-500">{event.date ? new Date(event.date).toLocaleString() : '—'} {event.officer ? `· ${event.officer}` : ''}</p>
              {event.details && <p className="text-xs text-slate-400 mt-0.5">{event.details}</p>}
            </div>
          ))}
        </div>
      )}
    </KycCard>
  );
}