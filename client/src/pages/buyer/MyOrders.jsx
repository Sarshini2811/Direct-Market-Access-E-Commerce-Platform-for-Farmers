import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { Loader, EmptyState, StatusBadge, Pagination } from '../../components/Common';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await orderService.mine({ page, limit: 10, ...(status ? { status } : {}) });
      setOrders(res.data);
      setMeta(res.meta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, [status]); // eslint-disable-line

  return (
    <div className="container-page py-8">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-forest-900">My Orders</h1>
        <select className="input w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['placed', 'accepted', 'packed', 'dispatched', 'delivered', 'cancelled', 'rejected'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? <Loader /> : orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders yet" description="Your placed orders will show up here." action={<Link to="/marketplace" className="btn-primary">Browse marketplace</Link>} />
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((o) => (
              <Link key={o._id} to={`/orders/${o._id}`} className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="font-medium text-forest-900">Order #{o._id.slice(-6)}</p>
                  <p className="text-xs text-forest-400 mt-0.5">{new Date(o.createdAt).toLocaleDateString()} · {o.items.length} item(s)</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">₹{o.totalAmount}</span>
                  <StatusBadge status={o.status} />
                </div>
              </Link>
            ))}
          </div>
          <Pagination page={meta.page} totalPages={meta.totalPages} onChange={load} />
        </>
      )}
    </div>
  );
}
