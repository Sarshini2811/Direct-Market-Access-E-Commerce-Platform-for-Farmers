import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Calendar } from 'lucide-react';
import { preOrderService } from '../../services/preOrderGroupBuyService';
import { Loader, EmptyState, StatusBadge, Pagination } from '../../components/Common';
import { getProductImage, handleImageFallback } from '../../utils/productImages';

export default function PreOrdersList() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await preOrderService.list({ page, limit: 12 });
      setItems(res.data);
      setMeta(res.meta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-forest-900 flex items-center gap-2">
          <Sprout className="text-leaf-600" /> Upcoming Harvests — Smart Pre-Orders
        </h1>
        <p className="text-forest-500 text-sm mt-1">
          Reserve produce before it's harvested. Dates are farmer estimates until confirmed.
        </p>
      </div>

      {loading ? <Loader /> : items.length === 0 ? (
        <EmptyState title="No upcoming harvests right now" description="Check back soon — farmers regularly publish new pre-orders." />
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-5">
            {items.map((h) => {
              const coverImg = getProductImage({ name: h.productName, category: h.category, image: h.image });
              return (
                <Link key={h._id} to={`/preorders/${h._id}`} className="card overflow-hidden group hover:shadow-lg transition-shadow flex flex-col">
                  <div className="aspect-[16/10] bg-leaf-50 relative overflow-hidden">
                    <img
                      src={coverImg}
                      alt={h.productName}
                      onError={(e) => handleImageFallback(e, h.category)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2">
                      <StatusBadge status={h.status} />
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="font-semibold text-forest-900 text-lg">{h.productName}</p>
                    <p className="text-sm text-forest-500 flex items-center gap-1 mt-1">
                      <Calendar size={13} /> Est. harvest {new Date(h.expectedHarvestDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-forest-600 mt-2">Grown by {h.farmer?.name}</p>
                    <div className="mt-auto pt-3 border-t border-forest-50 flex items-baseline justify-between">
                      <p className="font-semibold text-forest-900">₹{h.pricePerUnit} <span className="text-xs text-forest-400 font-normal">/ {h.unit}</span></p>
                      <p className="text-xs text-leaf-700 font-medium">
                        {Math.max(0, h.estimatedQuantity - h.quantityReserved)} {h.unit} left
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <Pagination page={meta.page} totalPages={meta.totalPages} onChange={load} />
        </>
      )}
    </div>
  );
}
