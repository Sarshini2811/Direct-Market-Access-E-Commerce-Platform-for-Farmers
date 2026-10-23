import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, BadgeCheck, ShoppingCart, Calendar, Package, Flag } from 'lucide-react';
import { productService } from '../../services/productService';
import { reviewService } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Loader, EmptyState, StatusBadge } from '../../components/Common';
import { reportService } from '../../services/miscServices';
import { getProductImage, handleImageFallback } from '../../utils/productImages';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWholesale, setIsWholesale] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [res, revRes] = await Promise.all([
          productService.get(id),
          reviewService.productReviews(id),
        ]);
        setData(res.data);
        setReviews(revRes.data.reviews);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <Loader />;
  if (!data) return <EmptyState title="Product not found" />;

  const { product, farmerProfile } = data;
  const available = Math.max(0, product.quantityAvailable - product.quantityReserved);

  const handleAdd = async () => {
    if (!user) return navigate('/login');
    if (user.role !== 'buyer') return setMsg('Only buyer accounts can purchase.');
    try {
      await addToCart(product._id, Number(quantity), isWholesale);
      setMsg('Added to cart!');
      setTimeout(() => setMsg(''), 2000);
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handleReport = async () => {
    const reason = window.prompt('Describe the issue with this listing:');
    if (!reason) return;
    try {
      await reportService.create({ targetType: 'product', targetId: product._id, reason });
      setMsg('Report submitted to admins. Thank you.');
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="container-page py-8">
      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <div className="aspect-square rounded-xl overflow-hidden bg-leaf-50 mb-3 shadow-sm border border-forest-100">
            <img
              src={product.images?.length ? product.images[activeImg] : getProductImage(product)}
              className="w-full h-full object-cover"
              alt={product.name}
              onError={(e) => handleImageFallback(e, product.category)}
            />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${activeImg === i ? 'border-leaf-500' : 'border-transparent'}`}>
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="badge bg-forest-50 text-forest-700 capitalize">{product.category}</span>
            <span className="badge bg-forest-50 text-forest-700">Grade {product.grade}</span>
            {farmerProfile?.verificationStatus === 'verified' && (
              <span className="badge bg-leaf-100 text-leaf-800"><BadgeCheck size={14} /> Verified farm</span>
            )}
          </div>
          <h1 className="font-display text-3xl font-semibold text-forest-900">{product.name}</h1>
          <Link to={`/farmers/${product.farmer._id}`} className="text-forest-500 text-sm flex items-center gap-1 mt-1 hover:text-leaf-700">
            <MapPin size={14} /> {farmerProfile?.farmName || product.farmer.name} · {product.location?.district}
          </Link>

          <div className="flex items-baseline gap-2 mt-4">
            {product.isSurplusDiscount ? (
              <>
                <span className="text-2xl font-semibold text-forest-900">₹{product.effectivePrice}</span>
                <span className="text-forest-400 line-through">₹{product.price}</span>
                <span className="badge bg-amber-500 text-white">{product.surplusDiscountPercent}% off</span>
              </>
            ) : (
              <span className="text-2xl font-semibold text-forest-900">₹{product.price}</span>
            )}
            <span className="text-forest-400">/ {product.unit}</span>
          </div>

          {product.wholesale?.enabled && (
            <p className="text-sm text-forest-600 mt-1">
              Bulk price: <strong>₹{product.wholesale.pricePerUnit}/{product.unit}</strong> for {product.wholesale.minQuantity}+ {product.unit}
            </p>
          )}

          <p className="text-forest-600 mt-4 text-sm leading-relaxed">{product.description}</p>

          <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
            <div className="card p-3">
              <p className="text-forest-400 text-xs flex items-center gap-1"><Package size={12} /> Available</p>
              <p className="font-medium">{available} {product.unit}</p>
            </div>
            {product.harvestDate && (
              <div className="card p-3">
                <p className="text-forest-400 text-xs flex items-center gap-1"><Calendar size={12} /> Harvested</p>
                <p className="font-medium">{new Date(product.harvestDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {available > 0 ? (
            <div className="mt-6 space-y-3">
              {product.wholesale?.enabled && (
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-1.5"><input type="radio" checked={!isWholesale} onChange={() => setIsWholesale(false)} /> Retail</label>
                  <label className="flex items-center gap-1.5"><input type="radio" checked={isWholesale} onChange={() => setIsWholesale(true)} /> Wholesale (min {product.wholesale.minQuantity})</label>
                </div>
              )}
              <div className="flex items-center gap-3">
                <input type="number" min="1" max={available} value={quantity}
                  onChange={(e) => setQuantity(e.target.value)} className="input w-24" />
                <button onClick={handleAdd} className="btn-primary flex-1">
                  <ShoppingCart size={18} /> Add to cart
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-6 badge bg-red-50 text-red-700">Out of stock</p>
          )}

          {msg && <p className="mt-3 text-sm text-leaf-700">{msg}</p>}

          <button onClick={handleReport} className="mt-6 flex items-center gap-1.5 text-xs text-forest-400 hover:text-red-500">
            <Flag size={13} /> Report this listing
          </button>
        </div>
      </div>

      <div className="mt-14 max-w-2xl">
        <h2 className="font-display text-xl font-semibold text-forest-900 mb-4">Buyer reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-forest-400">No reviews yet — be the first buyer to review this after a completed order.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r._id} className="card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{r.buyer?.name}</p>
                  <span className="flex items-center gap-0.5 text-amber-600 text-sm">
                    <Star size={14} fill="currentColor" /> {r.rating}
                  </span>
                </div>
                {r.comment && <p className="text-sm text-forest-600 mt-1.5">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
