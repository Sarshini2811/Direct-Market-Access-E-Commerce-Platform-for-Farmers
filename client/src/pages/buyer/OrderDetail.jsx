import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Truck, Store, Star } from 'lucide-react';
import { orderService, reviewService } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { Loader, EmptyState, StatusBadge } from '../../components/Common';
import { getProductImage } from '../../utils/productImages';

const STAGES = ['placed', 'accepted', 'packed', 'dispatched', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [reviewForm, setReviewForm] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await orderService.get(id);
      setOrder(res.data.order);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <Loader />;
  if (!order) return <EmptyState title="Order not found" />;

  const isBuyer = user && (order.buyer._id === user._id || order.buyer === user._id);
  const stageIndex = STAGES.indexOf(order.status);
  const isTerminalBad = ['cancelled', 'rejected', 'refunded'].includes(order.status);

  const cancelOrder = async () => {
    if (!window.confirm('Cancel this order? Reserved stock will be released.')) return;
    try {
      const res = await orderService.cancel(id, 'Cancelled by buyer');
      setOrder(res.data.order);
    } catch (err) {
      setMsg(err.message);
    }
  };

  const submitReview = async (productId) => {
    const payload = reviewForm[productId];
    if (!payload?.rating) return setMsg('Please select a star rating.');
    try {
      await reviewService.create({ orderId: id, productId, rating: payload.rating, comment: payload.comment });
      setMsg('Review submitted — thank you!');
      setReviewForm((f) => ({ ...f, [productId]: { ...f[productId], submitted: true } }));
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="container-page py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-semibold text-forest-900">Order #{order._id.slice(-6)}</h1>
        <StatusBadge status={order.status} />
      </div>

      {!isTerminalBad && (
        <div className="card p-5 mb-6">
          <div className="flex justify-between">
            {STAGES.map((s, i) => (
              <div key={s} className="flex-1 flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${i <= stageIndex ? 'bg-leaf-600 text-white' : 'bg-forest-100 text-forest-400'}`}>
                  {i + 1}
                </div>
                <p className={`text-xs mt-1 capitalize ${i <= stageIndex ? 'text-forest-800 font-medium' : 'text-forest-400'}`}>{s}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-forest-400 text-center mt-3">
            Status-based tracking (no live GPS). {order.tracking?.deliveryPartnerName && `Delivery partner: ${order.tracking.deliveryPartnerName}`}
          </p>
        </div>
      )}

      <div className="card p-5 mb-6">
        <p className="font-medium mb-3 flex items-center gap-2">
          {order.deliveryMethod === 'delivery' ? <Truck size={16} /> : <Store size={16} />}
          {order.deliveryMethod === 'delivery' ? 'Home delivery' : 'Farm pickup'}
        </p>
        {order.deliveryAddress?.line1 && (
          <p className="text-sm text-forest-500">{order.deliveryAddress.line1}, {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
        )}
      </div>

      <div className="card p-5 mb-6">
        <p className="font-medium mb-3">Items</p>
        <div className="space-y-4">
          {order.items.map((item) => {
            const itemImg = getProductImage({ name: item.nameSnapshot });
            return (
              <div key={item._id} className="border-b border-forest-50 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between text-sm gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={itemImg}
                      alt={item.nameSnapshot}
                      className="w-12 h-12 rounded-lg object-cover border border-forest-100 shrink-0"
                    />
                    <div>
                      <p className="font-medium text-forest-900">{item.nameSnapshot}</p>
                      <p className="text-xs text-forest-400">Qty: {item.quantity} {item.unit}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-forest-900">₹{item.lineTotal}</span>
                </div>

              {isBuyer && order.status === 'delivered' && order.isReviewEligible && !reviewForm[item.product]?.submitted && (
                <div className="mt-2 bg-leaf-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-forest-700 mb-1.5">Rate this product</p>
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setReviewForm((f) => ({ ...f, [item.product]: { ...f[item.product], rating: n } }))}>
                        <Star size={18} className={n <= (reviewForm[item.product]?.rating || 0) ? 'text-amber-500' : 'text-forest-200'} fill={n <= (reviewForm[item.product]?.rating || 0) ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                  <textarea className="input text-sm" rows={2} placeholder="Optional comment"
                    onChange={(e) => setReviewForm((f) => ({ ...f, [item.product]: { ...f[item.product], comment: e.target.value } }))} />
                  <button className="btn-secondary btn-sm mt-2" onClick={() => submitReview(item.product)}>Submit review</button>
                </div>
              )}
              {reviewForm[item.product]?.submitted && <p className="text-xs text-leaf-700 mt-2">✓ Review submitted</p>}
            </div>
          );
        })}
        </div>
        <div className="flex justify-between font-semibold mt-4 pt-3 border-t border-forest-100">
          <span>Total</span><span>₹{order.totalAmount}</span>
        </div>
      </div>

      {isBuyer && ['placed', 'accepted'].includes(order.status) && (
        <button onClick={cancelOrder} className="btn-danger">Cancel order</button>
      )}
      {msg && <p className="text-sm text-leaf-700 mt-3">{msg}</p>}
    </div>
  );
}
