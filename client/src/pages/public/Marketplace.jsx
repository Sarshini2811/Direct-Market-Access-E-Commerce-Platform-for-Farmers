import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { productService } from '../../services/productService';
import ProductCard from '../../components/ProductCard';
import { Loader, EmptyState, Pagination } from '../../components/Common';

const CATEGORIES = ['vegetables', 'fruits', 'grains', 'pulses', 'dairy', 'spices', 'herbs', 'flowers', 'other'];

export default function Marketplace() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    q: params.get('q') || '',
    category: params.get('category') || '',
    minPrice: '',
    maxPrice: '',
    surplusOnly: false,
    wholesaleOnly: false,
    verifiedOnly: false,
    sort: '-createdAt',
  });

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const query = { ...filters, page, limit: 12 };
      Object.keys(query).forEach((k) => (query[k] === '' || query[k] === false) && delete query[k]);
      const res = await productService.list(query);
      setProducts(res.data);
      setMeta(res.meta);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchProducts(1); }, [fetchProducts]);

  const applyFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="container-page py-8">
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-forest-900">Marketplace</h1>
          <p className="text-forest-500 text-sm mt-1">{meta.total || 0} listings available right now</p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400" size={16} />
            <input
              className="input pl-9"
              placeholder="Search produce…"
              value={filters.q}
              onChange={(e) => applyFilter('q', e.target.value)}
            />
          </div>
          <button className="btn-outline md:hidden" onClick={() => setShowFilters((s) => !s)}>
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-8">
        <aside className={`${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="card p-4 space-y-5 sticky top-20">
            <div className="flex items-center justify-between md:hidden">
              <p className="font-semibold">Filters</p>
              <button onClick={() => setShowFilters(false)}><X size={18} /></button>
            </div>
            <div>
              <p className="text-xs font-semibold text-forest-500 uppercase mb-2">Category</p>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="category" checked={!filters.category} onChange={() => applyFilter('category', '')} /> All
                </label>
                {CATEGORIES.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm capitalize">
                    <input type="radio" name="category" checked={filters.category === c} onChange={() => applyFilter('category', c)} /> {c}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-forest-500 uppercase mb-2">Price range (₹)</p>
              <div className="flex gap-2">
                <input type="number" min="0" placeholder="Min" className="input" value={filters.minPrice}
                  onChange={(e) => applyFilter('minPrice', e.target.value)} />
                <input type="number" min="0" placeholder="Max" className="input" value={filters.maxPrice}
                  onChange={(e) => applyFilter('maxPrice', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={filters.surplusOnly} onChange={(e) => applyFilter('surplusOnly', e.target.checked)} />
                Surplus / discounted
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={filters.wholesaleOnly} onChange={(e) => applyFilter('wholesaleOnly', e.target.checked)} />
                Bulk / wholesale available
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={filters.verifiedOnly} onChange={(e) => applyFilter('verifiedOnly', e.target.checked)} />
                Verified farmers only
              </label>
            </div>
            <div>
              <p className="text-xs font-semibold text-forest-500 uppercase mb-2">Sort by</p>
              <select className="input" value={filters.sort} onChange={(e) => applyFilter('sort', e.target.value)}>
                <option value="-createdAt">Newest</option>
                <option value="price">Price: low to high</option>
                <option value="-price">Price: high to low</option>
                <option value="-ratingAverage">Top rated</option>
              </select>
            </div>
          </div>
        </aside>

        <div>
          {loading ? <Loader /> : products.length === 0 ? (
            <EmptyState title="No produce matches your filters" description="Try widening your search or clearing some filters." />
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
              <Pagination page={meta.page} totalPages={meta.totalPages} onChange={fetchProducts} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
