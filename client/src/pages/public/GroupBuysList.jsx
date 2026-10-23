import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock } from 'lucide-react';
import { groupBuyService } from '../../services/preOrderGroupBuyService';
import { Loader, EmptyState, StatusBadge, Pagination } from '../../components/Common';
import { getProductImage, handleImageFallback } from '../../utils/productImages';

export default function GroupBuysList() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await groupBuyService.list({ status: 'open', page, limit: 12 });
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
          <Users className="text-leaf-600" /> Group Buys
        </h1>
        <p className="text-forest-500 text-sm mt-1">Join others to unlock bulk/wholesale pricing on shared orders.</p>
      </div>

      {loading ? <Loader /> : items.length === 0 ? (
        <EmptyState title="No open group buys" description="Start one from any wholesale-enabled product's page, or check back later." />
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-5">
            {items.map((g) => {
              const pct = Math.min(100, Math.round((g.quantityCommitted / g.targetQuantity) * 100));
              const coverImg = getProductImage(g.product);
              return (
                <Link key={g._id} to={`/groupbuys/${g._id}`} className="card overflow-hidden group hover:shadow-lg transition-shadow flex flex-col">
                  <div className="aspect-[16/10] bg-leaf-50 relative overflow-hidden">
                    <img
                      src={coverImg}
                      alt={g.product?.name || 'Group buy produce'}
                      onError={(e) => handleImageFallback(e, g.product?.category)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2">
                      <StatusBadge status={g.status} />
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="font-semibold text-forest-900 text-lg">{g.product?.name}</p>
                    <p className="text-xs text-forest-500 mt-0.5">by {g.farmer?.name}</p>
                    <p className="font-medium text-forest-900 mt-2">₹{g.pricePerUnit} / {g.product?.unit}</p>
                    <div className="mt-3">
                      <div className="h-2 bg-forest-100 rounded-full overflow-hidden">
                        <div className="h-full bg-leaf-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-forest-400 mt-1">{g.quantityCommitted} / {g.targetQuantity} committed ({pct}%)</p>
                    </div>
                    <p className="text-xs text-forest-400 mt-3 pt-2 border-t border-forest-50 flex items-center gap-1">
                      <Clock size={12} /> Closes {new Date(g.closesAt).toLocaleDateString()}
                    </p>
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
