import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Sprout, AlertTriangle } from 'lucide-react';
import { preOrderService } from '../../services/preOrderGroupBuyService';
import { useAuth } from '../../context/AuthContext';
import { Loader, EmptyState, StatusBadge } from '../../components/Common';
import { getProductImage, handleImageFallback } from '../../utils/productImages';

export default function PreOrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [preOrder, setPreOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await preOrderService.get(id);
      setPreOrder(res.data.preOrder);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <Loader />;
  if (!preOrder) return <EmptyState title="Harvest listing not found" />;

  const remaining = Math.max(0, preOrder.estimatedQuantity - preOrder.quantityReserved);
  const myReservations = user ? preOrder.reservations?.filter((r) => r.buyer === user._id && !r.cancelled) : [];

  const reserve = async () => {
    setMsg('');
    try {
      const res = await preOrderService.reserve(id, Number(quantity));
      setPreOrder(res.data.preOrder);
      setMsg('Reservation confirmed — this is an estimate until the farmer confirms readiness.');
    } catch (err) {
      setMsg(err.message);
    }
  };

  const coverImg = getProductImage({ name: preOrder.productName, category: preOrder.category, image: preOrder.image });

  return (
    <div className="container-page py-8 max-w-3xl">
      <div className="card overflow-hidden">
        <div className="aspect-[21/9] w-full bg-leaf-50 overflow-hidden relative">
          <img
            src={coverImg}
            alt={preOrder.productName}
            onError={(e) => handleImageFallback(e, preOrder.category)}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between mb-1">
            <h1 className="font-display text-2xl font-semibold text-forest-900 flex items-center gap-2">
              <Sprout className="text-leaf-600" /> {preOrder.productName}
            </h1>
            <StatusBadge status={preOrder.status} />
          </div>
          <p className="text-forest-500 text-sm">by {preOrder.farmer?.name}</p>

        <div className="bg-amber-50 text-amber-800 text-sm rounded-lg px-4 py-3 mt-4 flex gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p>
            Expected harvest: <strong>{new Date(preOrder.expectedHarvestDate).toLocaleDateString()}</strong> — this is
            a farmer estimate, not a guaranteed date.
            {preOrder.delayNote && <> Latest update: {preOrder.delayNote}</>}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-5 text-sm">
          <div className="card p-3">
            <p className="text-forest-400 text-xs">Price</p>
            <p className="font-medium">₹{preOrder.pricePerUnit} / {preOrder.unit}</p>
          </div>
          <div className="card p-3">
            <p className="text-forest-400 text-xs">Remaining to reserve</p>
            <p className="font-medium">{remaining} / {preOrder.estimatedQuantity} {preOrder.unit}</p>
          </div>
        </div>

        {preOrder.status === 'fulfilled' ? (
          <p className="mt-6 badge bg-leaf-100 text-leaf-800">
            Harvested! This produce is now live in the marketplace.
          </p>
        ) : remaining > 0 ? (
          <div className="mt-6 flex items-center gap-3">
            <input type="number" min="1" max={preOrder.maxPerBuyer || remaining} value={quantity}
              onChange={(e) => setQuantity(e.target.value)} className="input w-28" />
            <button onClick={reserve} className="btn-primary" disabled={!user}>
              {user ? 'Reserve quantity' : 'Log in to reserve'}
            </button>
          </div>
        ) : (
          <p className="mt-6 badge bg-gray-100 text-gray-700">Fully reserved</p>
        )}

        {preOrder.maxPerBuyer > 0 && <p className="text-xs text-forest-400 mt-2">Max {preOrder.maxPerBuyer} {preOrder.unit} per buyer.</p>}
        {msg && <p className="text-sm text-leaf-700 mt-3">{msg}</p>}

        {myReservations?.length > 0 && (
          <div className="mt-6 border-t border-forest-100 pt-4">
            <p className="font-medium text-sm mb-2">Your reservations</p>
            {myReservations.map((r) => (
              <p key={r._id} className="text-sm text-forest-600">{r.quantity} {preOrder.unit} at ₹{r.pricePerUnitAtReservation}/{preOrder.unit}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);
}
