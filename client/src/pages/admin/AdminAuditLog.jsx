import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/miscServices';
import { Loader, EmptyState, Pagination } from '../../components/Common';

export default function AdminAuditLog() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.auditLog({ page, limit: 25 });
      setItems(res.data);
      setMeta(res.meta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);
  if (loading) return <Loader />;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-semibold text-forest-900">Audit Log</h1>
      {items.length === 0 ? <EmptyState title="No admin actions recorded yet" /> : (
        <>
          <div className="card divide-y divide-forest-50">
            {items.map((log) => (
              <div key={log._id} className="p-4 text-sm flex justify-between flex-wrap gap-2">
                <div>
                  <span className="font-medium">{log.actor?.name || 'System'}</span>
                  <span className="text-forest-500"> — {log.action}</span>
                  {log.targetType && <span className="text-forest-400"> ({log.targetType})</span>}
                </div>
                <span className="text-forest-400 text-xs">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <Pagination page={meta.page} totalPages={meta.totalPages} onChange={load} />
        </>
      )}
    </div>
  );
}
