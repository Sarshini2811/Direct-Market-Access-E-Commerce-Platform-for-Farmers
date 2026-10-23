import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { IndianRupee, Package, Clock, CheckCircle2, AlertTriangle, Plus } from 'lucide-react';
import { KpiCard, Loader, EmptyState } from '../../components/Common';
import { analyticsService } from '../../services/miscServices';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';

export default function FarmerDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [a, p, o] = await Promise.all([
          analyticsService.farmer(),
          productService.mine(),
          orderService.farmerOrders({ limit: 5 }),
        ]);
        setAnalytics(a.data);
        setProducts(p.data.products);
        setRecentOrders(o.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loader />;

  const lowStock = products.filter((p) => p.isActive && (p.quantityAvailable - p.quantityReserved) < 10 && (p.quantityAvailable - p.quantityReserved) > 0);
  const nearExpiry = products.filter((p) => p.expiryOrFreshUntil && new Date(p.expiryOrFreshUntil) - new Date() < 3 * 24 * 60 * 60 * 1000 && new Date(p.expiryOrFreshUntil) > new Date());
  const pendingOrders = analytics.statusBreakdown.find((s) => s._id === 'placed')?.count || 0;
  const totalRevenue = analytics.revenueOverTime.reduce((s, r) => s + r.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-forest-900">Farmer Dashboard</h1>
        <Link to="/farmer/products/new" className="btn-primary"><Plus size={16} /> Add produce</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total revenue" value={`₹${totalRevenue.toFixed(0)}`} icon={IndianRupee} accent="leaf" sub="From delivered orders" />
        <KpiCard label="Active listings" value={products.filter((p) => p.isActive).length} icon={Package} accent="forest" />
        <KpiCard label="Pending orders" value={pendingOrders} icon={Clock} accent="amber" />
        <KpiCard label="Order completion" value={`${analytics.orderCompletionRate}%`} icon={CheckCircle2} accent="leaf" />
      </div>

      {(lowStock.length > 0 || nearExpiry.length > 0) && (
        <div className="card p-4 bg-amber-50 border-amber-200">
          <p className="font-medium text-amber-800 flex items-center gap-2 mb-2"><AlertTriangle size={16} /> Inventory alerts</p>
          <ul className="text-sm text-amber-700 space-y-1">
            {lowStock.map((p) => <li key={p._id}>Low stock: {p.name} ({p.quantityAvailable - p.quantityReserved} {p.unit} left)</li>)}
            {nearExpiry.map((p) => <li key={p._id}>Nearing freshness deadline: {p.name}</li>)}
          </ul>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <p className="font-medium mb-3">Revenue trend</p>
          {analytics.revenueOverTime.length === 0 ? <p className="text-sm text-forest-400">No delivered orders yet.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analytics.revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0ebe2" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#537f32" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card p-5">
          <p className="font-medium mb-3">Best-selling produce</p>
          {analytics.bestSellers.length === 0 ? <p className="text-sm text-forest-400">No sales data yet.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.bestSellers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0ebe2" />
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#87ba5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex justify-between items-center mb-3">
          <p className="font-medium">Recent orders</p>
          <Link to="/farmer/orders" className="text-sm text-leaf-700">View all</Link>
        </div>
        {recentOrders.length === 0 ? <EmptyState title="No orders yet" /> : (
          <div className="divide-y divide-forest-50">
            {recentOrders.map((o) => (
              <div key={o._id} className="py-2.5 flex justify-between text-sm">
                <span>#{o._id.slice(-6)} · {o.buyer?.name}</span>
                <span className="capitalize text-forest-500">{o.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
