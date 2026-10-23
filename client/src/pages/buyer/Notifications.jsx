import React, { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { notificationService } from '../../services/miscServices';
import { Loader, EmptyState } from '../../components/Common';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await notificationService.list();
      setItems(res.data.notifications);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await notificationService.markRead(id);
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    await notificationService.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  if (loading) return <Loader />;

  return (
    <div className="container-page py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-semibold text-forest-900 flex items-center gap-2">
          <Bell /> Notifications
        </h1>
        <button className="btn-outline btn-sm" onClick={markAllRead}>Mark all read</button>
      </div>

      {items.length === 0 ? <EmptyState title="No notifications yet" /> : (
        <div className="space-y-2">
          {items.map((n) => (
            <div key={n._id} className={`card p-4 flex items-start justify-between gap-3 ${!n.isRead ? 'border-leaf-300 bg-leaf-50/50' : ''}`}>
              <div>
                <p className="font-medium text-sm text-forest-900">{n.title}</p>
                <p className="text-sm text-forest-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-forest-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.isRead && (
                <button onClick={() => markRead(n._id)} className="p-1.5 rounded-lg hover:bg-leaf-100 text-leaf-700 shrink-0">
                  <Check size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
