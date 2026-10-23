import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, BadgeCheck } from 'lucide-react';
import { getProductImage, handleImageFallback } from '../utils/productImages';

export default function ProductCard({ product }) {
  const coverImage = getProductImage(product);
  const hasDiscount = product.isSurplusDiscount && product.surplusDiscountPercent > 0;

  return (
    <Link to={`/products/${product._id}`} className="card overflow-hidden group hover:shadow-lg transition-shadow flex flex-col">
      <div className="aspect-[4/3] bg-leaf-50 relative overflow-hidden">
        <img
          src={coverImage}
          alt={product.name}
          onError={(e) => handleImageFallback(e, product.category)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {hasDiscount && (
          <span className="absolute top-2 left-2 badge bg-amber-500 text-white shadow-sm font-medium">
            {product.surplusDiscountPercent}% off — surplus
          </span>
        )}
        {product.wholesale?.enabled && (
          <span className="absolute top-2 right-2 badge bg-forest-800/90 text-white shadow-sm">Bulk available</span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-forest-900 leading-snug">{product.name}</h3>
          {product.ratingCount > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-600 shrink-0">
              <Star size={12} fill="currentColor" /> {product.ratingAverage}
            </span>
          )}
        </div>
        <p className="text-xs text-forest-400 flex items-center gap-1">
          <MapPin size={12} /> {product.location?.district || 'Location N/A'}
          {product.farmer?.name && <> · {product.farmer.name}</>}
        </p>
        <div className="mt-auto pt-2 flex items-baseline gap-1.5">
          {hasDiscount ? (
            <>
              <span className="font-semibold text-forest-900">₹{product.effectivePrice}</span>
              <span className="text-xs text-forest-400 line-through">₹{product.price}</span>
            </>
          ) : (
            <span className="font-semibold text-forest-900">₹{product.price}</span>
          )}
          <span className="text-xs text-forest-400">/ {product.unit}</span>
        </div>
      </div>
    </Link>
  );
}

export function VerifiedBadge() {
  return (
    <span className="badge bg-leaf-100 text-leaf-800">
      <BadgeCheck size={14} /> Verified farm
    </span>
  );
}
