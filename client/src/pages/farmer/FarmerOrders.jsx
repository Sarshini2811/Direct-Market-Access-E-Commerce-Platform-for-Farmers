import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { Loader, EmptyState, StatusBadge, Pagination } from '../../components/Common';

const NEXT_STATUS = {
  placed: ['accepted', 'rejected'],
  accepted: ['packed'],
  packed: ['dispatched'],
  dispatched: ['delivered'],
};

export default function FarmerOrders() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [msg, setMsg] = useState('');

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await orderService.farmerOrders({ page, limit: 10, ...(status ? { status } : {}) });
      setOrders(res.data);
      setMeta(res.meta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, [status]); // eslint-disable-line

  const advance = async (id, next) => {
    try {
      const note = window.prompt(`Optional note for moving order to "${next}":`, '') || undefined;
      const res = await orderService.updateStatus(id, { status: next, note });
      setOrders((prev) => prev.map((o) => (o._id === id ? res.data.order : o)));
    } catch (err) {
      setMsg(err.message);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-forest-900">Orders</h1>
        <select className="input w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['placed', 'accepted', 'packed', 'dispatched', 'delivered', 'cancelled', 'rejected'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {msg && <p className="text-sm text-red-600">{msg}</p>}

      {orders.length === 0 ? <EmptyState title="No orders found" /> : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-forest-50 text-forest-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Order</th>
                  <th className="text-left px-4 py-3">Buyer</th>
                  <th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="border-t border-forest-50">
                    <td className="px-4 py-3"><Link to={`/orders/${o._id}`} className="text-leaf-700 font-medium">#{o._id.slice(-6)}</Link></td>
                    <td className="px-4 py-3">{o.buyer?.name}</td>
                    <td className="px-4 py-3">₹{o.totalAmount}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-right space-x-1">
                      {(NEXT_STATUS[o.status] || []).map((next) => (
                        <button key={next} onClick={() => advance(o._id, next)} className="btn-outline btn-sm capitalize">{next}</button>
                      ))}
                    </td>
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
