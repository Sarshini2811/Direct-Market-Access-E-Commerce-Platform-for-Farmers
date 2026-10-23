import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Star, BadgeCheck } from 'lucide-react';
import { farmerService } from '../../services/productService';
import { productService } from '../../services/productService';
import ProductCard from '../../components/ProductCard';
import { Loader, EmptyState } from '../../components/Common';

export function FarmerPublicProfile() {
  const { farmerId } = useParams();
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [profileRes, productsRes] = await Promise.all([
          farmerService.publicProfile(farmerId),
          productService.list({ farmer: farmerId, limit: 12 }),
        ]);
        setData(profileRes.data);
        setProducts(productsRes.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [farmerId]);

  if (loading) return <Loader />;
  if (!data) return <EmptyState title="Farmer not found" />;

  const { profile, reviews } = data;

  return (
    <div className="container-page py-8">
      <div className="card p-6 mb-8">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h1 className="font-display text-2xl font-semibold text-forest-900">{profile.farmName}</h1>
            <p className="text-forest-500 text-sm flex items-center gap-1 mt-1">
              <MapPin size={14} /> {profile.location?.district}, {profile.location?.state}
            </p>
          </div>
          {profile.verificationStatus === 'verified' && (
            <span className="badge bg-leaf-100 text-leaf-800"><BadgeCheck size={14} /> Verified farm</span>
          )}
        </div>
        <p className="text-forest-600 text-sm mt-4 max-w-2xl">{profile.bio}</p>
        <div className="flex gap-6 mt-4 text-sm">
          <div><span className="font-semibold">{profile.yearsFarming || '—'}</span> <span className="text-forest-400">years farming</span></div>
          <div className="flex items-center gap-1"><Star size={14} className="text-amber-500" fill="currentColor" /> <span className="font-semibold">{profile.ratingAverage || 0}</span> <span className="text-forest-400">({profile.ratingCount || 0} reviews)</span></div>
          <div className="capitalize"><span className="font-semibold">{profile.farmingType}</span> <span className="text-forest-400">farming</span></div>
        </div>
      </div>

      <h2 className="font-display text-xl font-semibold text-forest-900 mb-4">Listings from this farm</h2>
      {products.length === 0 ? (
        <EmptyState title="No active listings" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}

      <h2 className="font-display text-xl font-semibold text-forest-900 mb-4">Buyer reviews</h2>
      {reviews.length === 0 ? <p className="text-sm text-forest-400">No reviews yet.</p> : (
        <div className="space-y-3 max-w-2xl">
          {reviews.map((r) => (
            <div key={r._id} className="card p-4">
              <div className="flex justify-between">
                <p className="font-medium text-sm">{r.buyer?.name}</p>
                <span className="flex items-center gap-0.5 text-amber-600 text-sm"><Star size={14} fill="currentColor" /> {r.rating}</span>
              </div>
              {r.comment && <p className="text-sm text-forest-600 mt-1">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function NotFound() {
  return (
    <div className="container-page py-24">
      <EmptyState title="404 — Page not found" description="The page you're looking for doesn't exist or has moved." />
    </div>
  );
}
