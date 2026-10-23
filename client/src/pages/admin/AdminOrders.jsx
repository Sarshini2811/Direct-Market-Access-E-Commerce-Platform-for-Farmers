import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/miscServices';
import { Loader, EmptyState, StatusBadge, Pagination } from '../../components/Common';

export default function AdminOrders() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.orders({ page, limit: 15, ...(status ? { status } : {}) });
      setItems(res.data);
      setMeta(res.meta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, [status]); // eslint-disable-line
  if (loading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-forest-900">All Orders</h1>
        <select className="input w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['placed', 'accepted', 'packed', 'dispatched', 'delivered', 'cancelled', 'rejected'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {items.length === 0 ? <EmptyState title="No orders found" /> : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-forest-50 text-forest-500 text-xs uppercase">
                <tr><th className="text-left px-4 py-3">Order</th><th className="text-left px-4 py-3">Buyer</th><th className="text-left px-4 py-3">Amount</th><th className="text-left px-4 py-3">Status</th></tr>
              </thead>
              <tbody>
                {items.map((o) => (
                  <tr key={o._id} className="border-t border-forest-50">
                    <td className="px-4 py-3"><Link to={`/orders/${o._id}`} className="text-leaf-700 font-medium">#{o._id.slice(-6)}</Link></td>
                    <td className="px-4 py-3">{o.buyer?.name}</td>
                    <td className="px-4 py-3">₹{o.totalAmount}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={meta.page} totalPages={meta.totalPages} onChange={load} />
        </>
      )}
    </div>
  );
}
