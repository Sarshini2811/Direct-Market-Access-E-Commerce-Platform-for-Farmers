import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';
import { Users, Package, ShoppingBag, IndianRupee, BadgeCheck, Flag } from 'lucide-react';
import { KpiCard, Loader } from '../../components/Common';
import { adminService, analyticsService } from '../../services/miscServices';

const COLORS = ['#336142', '#87ba5e', '#a97448', '#457a54', '#c2d8c7', '#e9deb9', '#8f5f39', '#679874'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, a] = await Promise.all([adminService.dashboard(), analyticsService.admin()]);
        setStats(s.data);
        setAnalytics(a.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loader />;

  const { totals, recentOrders } = stats;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-forest-900">Admin Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Farmers" value={totals.totalFarmers} icon={Users} accent="leaf" />
        <KpiCard label="Buyers" value={totals.totalBuyers} icon={Users} accent="forest" />
        <KpiCard label="Pending verifications" value={totals.pendingVerifications} icon={BadgeCheck} accent="amber" />
        <KpiCard label="Open reports" value={totals.openReports} icon={Flag} accent="red" />
        <KpiCard label="Active listings" value={`${totals.activeListings} / ${totals.totalListings}`} icon={Package} accent="forest" />
        <KpiCard label="Completed orders" value={`${totals.completedOrders} / ${totals.totalOrders}`} icon={ShoppingBag} accent="leaf" />
        <KpiCard label="Gross merchandise value" value={`₹${totals.grossMerchandiseValue.toFixed(0)}`} icon={IndianRupee} accent="leaf" sub="From delivered orders" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <p className="font-medium mb-3">Order volume trend</p>
          {analytics.orderVolumeTrend.length === 0 ? <p className="text-sm text-forest-400">No data yet.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analytics.orderVolumeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0ebe2" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#336142" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card p-5">
          <p className="font-medium mb-3">Category distribution (active listings)</p>
          {analytics.categoryDistribution.length === 0 ? <p className="text-sm text-forest-400">No data yet.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={analytics.categoryDistribution} dataKey="count" nameKey="_id" outerRadius={80} label>
                  {analytics.categoryDistribution.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex justify-between mb-3">
          <p className="font-medium">Recent activity</p>
          <Link to="/admin/orders" className="text-sm text-leaf-700">View all orders</Link>
        </div>
        <div className="divide-y divide-forest-50">
          {recentOrders.map((o) => (
            <div key={o._id} className="py-2.5 flex justify-between text-sm">
              <span>#{o._id.slice(-6)} · {o.buyer?.name}</span>
              <span className="capitalize text-forest-500">{o.status} · ₹{o.totalAmount}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-forest-400">{stats.note}</p>
    </div>
  );
}
