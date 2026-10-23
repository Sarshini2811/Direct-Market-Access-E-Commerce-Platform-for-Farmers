import React, { useEffect, useState } from 'react';
import { reportService } from '../../services/miscServices';
import { Loader, EmptyState, StatusBadge } from '../../components/Common';

export default function AdminReports() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('open');
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await reportService.list({ status, limit: 20 });
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]); // eslint-disable-line

  const resolve = async (id, action) => {
    const resolutionNote = window.prompt('Resolution note (optional):') || '';
    try {
      await reportService.resolve(id, { action, resolutionNote });
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-forest-900">Reports & Complaints</h1>
        <select className="input w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="open">Open</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All</option>
        </select>
      </div>
      {msg && <p className="text-sm text-red-600">{msg}</p>}

      {items.length === 0 ? <EmptyState title="No reports here" /> : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r._id} className="card p-5">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium capitalize">{r.targetType} report</p>
                  <p className="text-sm text-forest-500">by {r.reportedBy?.name} ({r.reportedBy?.email})</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <p className="text-sm text-forest-600 mt-2">{r.reason}</p>
              {r.status === 'open' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => resolve(r._id, 'remove_content')} className="btn-outline btn-sm text-red-600">Remove content</button>
                  {r.targetType === 'user' && <button onClick={() => resolve(r._id, 'suspend_user')} className="btn-outline btn-sm text-red-600">Suspend user</button>}
                  <button onClick={() => resolve(r._id, 'dismiss')} className="btn-outline btn-sm">Dismiss</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
