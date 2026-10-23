import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Store, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderService, paymentService } from '../../services/orderService';

export default function Checkout() {
  const { cart, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [address, setAddress] = useState({
    line1: user?.address?.line1 || '', city: user?.address?.city || '',
    state: user?.address?.state || '', pincode: user?.address?.pincode || '',
  });
  const [step, setStep] = useState('review'); // review -> paying -> done
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const items = cart.items || [];
  const total = items.reduce((sum, i) => sum + i.priceSnapshot * i.quantity, 0);

  const placeOrder = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await orderService.place({
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'delivery' ? address : undefined,
      });
      setPlacedOrder(res.data);
      setStep('paying');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async () => {
    setLoading(true);
    setError('');
    try {
      await paymentService.confirm({ paymentRecordId: placedOrder.paymentIntent.paymentRecordId });
      await refreshCart();
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && step === 'review') {
    return <div className="container-page py-16 text-center text-forest-500">Your cart is empty.</div>;
  }

  if (step === 'done') {
    return (
      <div className="container-page py-16 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-leaf-100 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="text-leaf-600" size={30} />
        </div>
        <h1 className="font-display text-2xl font-semibold text-forest-900">Order confirmed!</h1>
        <p className="text-forest-500 text-sm mt-2">Your payment was simulated successfully (demo mode). The farmer has been notified.</p>
        <button className="btn-primary mt-6" onClick={() => navigate('/orders')}>View my orders</button>
      </div>
    );
  }

  return (
    <div className="container-page py-8 grid md:grid-cols-[1fr_320px] gap-8 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-semibold text-forest-900 mb-5">Checkout</h1>

        {step === 'review' && (
          <form onSubmit={placeOrder} className="space-y-5">
            <div className="card p-5">
              <p className="font-medium mb-3">Delivery method</p>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setDeliveryMethod('pickup')}
                  className={`card p-4 flex flex-col items-center gap-1 ${deliveryMethod === 'pickup' ? 'ring-2 ring-leaf-500' : ''}`}>
                  <Store size={20} className="text-leaf-600" /> <span className="text-sm font-medium">Farm pickup</span>
                </button>
                <button type="button" onClick={() => setDeliveryMethod('delivery')}
                  className={`card p-4 flex flex-col items-center gap-1 ${deliveryMethod === 'delivery' ? 'ring-2 ring-leaf-500' : ''}`}>
                  <Truck size={20} className="text-leaf-600" /> <span className="text-sm font-medium">Home delivery</span>
                </button>
              </div>
            </div>

            {deliveryMethod === 'delivery' && (
              <div className="card p-5 space-y-3">
                <p className="font-medium">Delivery address</p>
                <input required className="input" placeholder="Address line" value={address.line1}
                  onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
                <div className="grid grid-cols-3 gap-2">
                  <input required className="input" placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                  <input required className="input" placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                  <input required className="input" placeholder="Pincode" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button className="btn-primary w-full" disabled={loading}>{loading ? 'Placing order…' : 'Place order'}</button>
          </form>
        )}

        {step === 'paying' && (
          <div className="card p-6">
            <p className="badge bg-amber-50 text-amber-700 mb-3">Demo payment — no real money moves</p>
            <p className="text-forest-600 text-sm mb-4">
              Order #{placedOrder.order._id.slice(-6)} placed. Stock has been reserved. Click below to
              simulate a successful payment and confirm the order with the farmer.
            </p>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}
            <button className="btn-primary w-full" onClick={confirmPayment} disabled={loading}>
              {loading ? 'Confirming…' : `Simulate payment of ₹${placedOrder.order.totalAmount}`}
            </button>
          </div>
        )}
      </div>

      <div className="card p-5 h-fit">
        <h2 className="font-semibold mb-3">Order summary</h2>
        {items.map((i) => (
          <div key={i._id} className="flex justify-between text-sm text-forest-600 py-1">
            <span>{i.product?.name} × {i.quantity}</span>
            <span>₹{(i.priceSnapshot * i.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-forest-100 mt-3 pt-3 flex justify-between font-semibold">
          <span>Total (excl. delivery fee)</span><span>₹{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
