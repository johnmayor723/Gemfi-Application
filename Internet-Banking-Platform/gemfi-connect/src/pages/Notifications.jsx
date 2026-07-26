import React, { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { getNotifications, markNotificationRead } from '@/api/notification.api';
import PageHeader from '@/components/PageHeader';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getNotifications().then(r => setItems(r.data || [])).catch(e => setError(e.body?.message || e.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const markRead = (n) => markNotificationRead(n.id || n._id).then(() =>
    setItems(items.map(i => (i.id || i._id) === (n.id || n._id) ? { ...i, isRead: true } : i))
  );

  return (
    <>
      <PageHeader title="Notifications" description="Account activity and security alerts." />
      {error && <p className="bg-red-50 text-red-700 p-4 rounded-xl mb-4">{error}</p>}
      {loading ? (
        <div className="h-44 bg-slate-100 animate-pulse rounded-2xl" />
      ) : items.length ? (
        <div className="bg-white border rounded-2xl divide-y">
          {items.map(n => (
            <div key={n.id || n._id} className={`p-5 flex items-start gap-4 ${n.isRead ? '' : 'bg-[#f5faf8]'}`}>
              <span className="w-10 h-10 shrink-0 rounded-xl bg-[#e7f4ef] text-[#006f51] grid place-items-center"><Bell size={18} /></span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{n.subject || n.type}</p>
                <p className="text-sm text-slate-500 mt-1">{n.message}</p>
                <p className="text-xs text-slate-400 mt-2">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</p>
              </div>
              {!n.isRead && <button onClick={() => markRead(n)} className="shrink-0 flex items-center gap-1 text-xs font-semibold text-[#006f51] hover:underline"><Check size={14} />Mark read</button>}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border rounded-2xl p-12 text-center text-slate-500">No notifications yet.</div>
      )}
    </>
  );
}
