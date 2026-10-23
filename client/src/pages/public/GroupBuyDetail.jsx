import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Clock } from 'lucide-react';
import { groupBuyService } from '../../services/preOrderGroupBuyService';
import { useAuth } from '../../context/AuthContext';
import { Loader, EmptyState, StatusBadge } from '../../components/Common';

export default function GroupBuyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [groupBuy, setGroupBuy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await groupBuyService.get(id);
      setGroupBuy(res.data.groupBuy);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <Loader />;
  if (!groupBuy) return <EmptyState title="Group buy not found" />;

  const pct = Math.min(100, Math.round((groupBuy.quantityCommitted / groupBuy.targetQuantity) * 100));
  const alreadyJoined = user && groupBuy.participants.some((p) => p.buyer?._id === user._id || p.buyer === user._id);
  const expired = new Date() > new Date(groupBuy.closesAt);

  const join = async () => {
    setMsg('');
    try {
      const res = await groupBuyService.join(id, Number(quantity));
      setGroupBuy(res.data.groupBuy);
      setMsg('Joined the group buy!');
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="container-page py-8 max-w-3xl">
      <div className="card p-6">
        <div className="flex items-start justify-between mb-1">
          <h1 className="font-display text-2xl font-semibold text-forest-900 flex items-center gap-2">
            <Users className="text-leaf-600" /> {groupBuy.product?.name}
          </h1>
          <StatusBadge status={groupBuy.status} />
        </div>
        <p className="text-forest-500 text-sm">by {groupBuy.farmer?.name} · ₹{groupBuy.pricePerUnit}/{groupBuy.product?.unit}</p>

        <div className="mt-5">
          <div className="h-3 bg-forest-100 rounded-full overflow-hidden">
            <div className="h-full bg-leaf-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-sm text-forest-500 mt-2">
            {groupBuy.quantityCommitted} / {groupBuy.targetQuantity} {groupBuy.product?.unit} committed ({pct}%)
          </p>
          <p className="text-xs text-forest-400 flex items-center gap-1 mt-1">
            <Clock size={12} /> Closes {new Date(groupBuy.closesAt).toLocaleString()} {expired && '(expired)'}
          </p>
        </div>

        {groupBuy.status === 'open' && !expired && !alreadyJoined && (
          <div className="mt-6 flex items-center gap-3">
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input w-28" />
            <button onClick={join} className="btn-primary" disabled={!user}>
              {user ? 'Join group buy' : 'Log in to join'}
            </button>
          </div>
        )}
        {alreadyJoined && <p className="mt-6 badge bg-leaf-100 text-leaf-800">You've joined this group buy</p>}
        {msg && <p className="text-sm text-leaf-700 mt-3">{msg}</p>}

        <div className="mt-6 border-t border-forest-100 pt-4">
          <p className="font-medium text-sm mb-2">Participants ({groupBuy.participants.length})</p>
          <div className="space-y-1">
            {groupBuy.participants.map((p, i) => (
              <p key={i} className="text-sm text-forest-600">{p.buyer?.name || 'Buyer'} — {p.quantity} {groupBuy.product?.unit}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
