import React, { useEffect, useState } from 'react';
import { verificationService } from '../../services/miscServices';
import { Loader, EmptyState, StatusBadge } from '../../components/Common';

export default function AdminVerifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await verificationService.list({ status, limit: 20 });
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]); // eslint-disable-line

  const decide = async (id, decision) => {
    const adminNote = window.prompt(`Note for ${decision} decision (optional):`) || '';
    try {
      await verificationService.decide(id, { decision, adminNote });
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-forest-900">Farmer Verification Requests</h1>
        <select className="input w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>
      {msg && <p className="text-sm text-red-600">{msg}</p>}

      {items.length === 0 ? <EmptyState title="No requests here" /> : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r._id} className="card p-5">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium">{r.farmerProfile?.farmName}</p>
                  <p className="text-sm text-forest-500">{r.farmer?.name} · {r.farmer?.email}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              {r.farmerNote && <p className="text-sm text-forest-600 mt-2">Note: {r.farmerNote}</p>}
              {r.documents?.length > 0 && (
                <ul className="text-xs text-forest-400 mt-1 list-disc list-inside">
                  {r.documents.map((d, i) => <li key={i}>{d.name}</li>)}
                </ul>
              )}
              {r.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => decide(r._id, 'approved')} className="btn-secondary btn-sm">Approve</button>
                  <button onClick={() => decide(r._id, 'rejected')} className="btn-outline btn-sm text-red-600">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
