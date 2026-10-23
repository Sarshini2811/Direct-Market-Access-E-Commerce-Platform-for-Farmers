import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { EmptyState, Loader } from '../../components/Common';
import { getProductImage, handleImageFallback } from '../../utils/productImages';

export default function Cart() {
  const { cart, loading, refreshCart, updateItem, removeItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => { refreshCart(); }, []); // eslint-disable-line

  if (loading) return <Loader />;

  const items = cart.items || [];
  const total = items.reduce((sum, i) => sum + i.priceSnapshot * i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse the marketplace to find fresh produce from farmers near you."
          action={<Link to="/marketplace" className="btn-primary">Browse marketplace</Link>}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8 grid md:grid-cols-[1fr_320px] gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-forest-900 mb-5">Your cart</h1>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="card p-4 flex gap-4 items-center">
              <div className="w-16 h-16 rounded-lg bg-leaf-50 overflow-hidden shrink-0 border border-forest-100">
                <img
                  src={getProductImage(item.product)}
                  onError={(e) => handleImageFallback(e, item.product?.category)}
                  className="w-full h-full object-cover"
                  alt={item.product?.name || ''}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-forest-900 truncate">{item.product?.name}</p>
                <p className="text-xs text-forest-400">{item.product?.farmer?.name} {item.isWholesale && '· Wholesale'}</p>
                <p className="text-sm font-medium text-forest-700 mt-1">₹{item.priceSnapshot} / {item.product?.unit}</p>
              </div>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(item._id, Number(e.target.value))}
                className="input w-20"
              />
              <button onClick={() => removeItem(item._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5 h-fit sticky top-20">
        <h2 className="font-semibold text-forest-900 mb-4">Order summary</h2>
        <div className="flex justify-between text-sm text-forest-600 mb-2">
          <span>Items subtotal</span><span>₹{total.toFixed(2)}</span>
        </div>
        <p className="text-xs text-forest-400 mb-4">Delivery fee (if applicable) calculated at checkout.</p>
        <button className="btn-primary w-full" onClick={() => navigate('/checkout')}>Proceed to checkout</button>
      </div>
    </div>
  );
}
