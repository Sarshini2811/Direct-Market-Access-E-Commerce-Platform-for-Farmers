import React, { useEffect, useState } from 'react';
import { Plus, Sprout, CheckCircle } from 'lucide-react';
import { preOrderService } from '../../services/preOrderGroupBuyService';
import { Loader, EmptyState, StatusBadge } from '../../components/Common';

const CATEGORIES = ['vegetables', 'fruits', 'grains', 'pulses', 'dairy', 'spices', 'herbs', 'flowers', 'other'];
const UNITS = ['kg', 'g', 'quintal', 'ton', 'dozen', 'piece', 'litre', 'bunch'];

export default function FarmerPreOrders() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    productName: '', category: 'vegetables', unit: 'kg',
    expectedHarvestDate: '', estimatedQuantity: '', pricePerUnit: '', maxPerBuyer: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await preOrderService.mine();
      setItems(res.data.preOrders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      await preOrderService.create(fd);
      setShowForm(false);
      setForm({ productName: '', category: 'vegetables', unit: 'kg', expectedHarvestDate: '', estimatedQuantity: '', pricePerUnit: '', maxPerBuyer: '' });
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const confirmHarvest = async (id, estimatedQuantity) => {
    const actualQuantity = window.prompt('Actual harvested quantity:', estimatedQuantity);
    if (!actualQuantity) return;
    try {
      await preOrderService.confirmHarvest(id, { actualQuantity: Number(actualQuantity) });
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const publishDelay = async (id) => {
    const delayNote = window.prompt('Describe the delay/update to notify buyers:');
    if (!delayNote) return;
    try {
      await preOrderService.update(id, { delayNote });
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-forest-900 flex items-center gap-2">
          <Sprout className="text-leaf-600" /> Smart Harvest / Pre-Orders
        </h1>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}><Plus size={16} /> Publish upcoming harvest</button>
      </div>
      {msg && <p className="text-sm text-red-600">{msg}</p>}

      {showForm && (
        <form onSubmit={submit} className="card p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Produce name" className="input" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <input required type="date" className="input" value={form.expectedHarvestDate} onChange={(e) => setForm({ ...form, expectedHarvestDate: e.target.value })} />
            <input required type="number" min="0" placeholder="Est. quantity" className="input" value={form.estimatedQuantity} onChange={(e) => setForm({ ...form, estimatedQuantity: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input required type="number" min="0" placeholder="Price per unit (₹)" className="input" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} />
            <input type="number" min="0" placeholder="Max per buyer (optional)" className="input" value={form.maxPerBuyer} onChange={(e) => setForm({ ...form, maxPerBuyer: e.target.value })} />
          </div>
          <p className="text-xs text-forest-400">Harvest date is treated as an estimate and shown as such to buyers.</p>
          <button className="btn-primary">Publish</button>
        </form>
      )}

      {items.length === 0 ? <EmptyState title="No upcoming harvests published" /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((p) => (
            <div key={p._id} className="card p-5">
              <div className="flex justify-between items-start">
                <p className="font-semibold">{p.productName}</p>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-sm text-forest-500 mt-1">Est. harvest: {new Date(p.expectedHarvestDate).toLocaleDateString()}</p>
              <p className="text-sm mt-2">₹{p.pricePerUnit}/{p.unit} · {p.quantityReserved}/{p.estimatedQuantity} reserved</p>
              {p.status !== 'fulfilled' && p.status !== 'cancelled' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => confirmHarvest(p._id, p.estimatedQuantity)} className="btn-secondary btn-sm"><CheckCircle size={14} /> Confirm harvest ready</button>
                  <button onClick={() => publishDelay(p._id)} className="btn-outline btn-sm">Post update/delay</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
