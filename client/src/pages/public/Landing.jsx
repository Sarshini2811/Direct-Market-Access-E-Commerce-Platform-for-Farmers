import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Sprout, Truck, ShieldCheck, Users, TrendingUp, ArrowRight,
  Leaf, Handshake, PackageCheck,
} from 'lucide-react';
import { productService } from '../../services/productService';
import { preOrderService } from '../../services/preOrderGroupBuyService';
import ProductCard from '../../components/ProductCard';
import { Loader } from '../../components/Common';
import { useNavigate } from 'react-router-dom';
import { getProductImage, handleImageFallback } from '../../utils/productImages';

const CATEGORY_CARDS = [
  { name: 'Fresh Vegetables', key: 'vegetables', count: 'Tomatoes, Spinach, Onions & more', img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80' },
  { name: 'Orchard Fruits', key: 'fruits', count: 'Mangoes, Bananas, Apples & more', img: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Paddy & Grains', key: 'grains', count: 'Sona Masoori, Wheat, Millets', img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Pulses & Lentils', key: 'pulses', count: 'Toor Dal, Chana & Legumes', img: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Aromatic Spices', key: 'spices', count: 'Guntur Chilli, Turmeric Powder', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80' },
];

export default function Landing() {
  const [featured, setFeatured] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const [p, h] = await Promise.all([
          productService.list({ limit: 8, sort: '-createdAt' }),
          preOrderService.list({ limit: 3 }),
        ]);
        setFeatured(p.data);
        setHarvests(h.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/marketplace${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-leaf-50 to-cream-50 border-b border-forest-100">
        <div className="container-page py-16 md:py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="badge bg-leaf-100 text-leaf-800 mb-4 inline-flex items-center gap-1.5 shadow-sm">
              <Sprout size={14} /> Farm to buyer, directly
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-forest-900 leading-tight">
              Fresh produce, straight from the farmer who grew it.
            </h1>
            <p className="text-forest-600 mt-4 text-lg max-w-lg">
              AgriDirect connects farmers directly with consumers, retailers, restaurants and
              wholesalers — transparent pricing, less waste, and a fairer deal for everyone.
            </p>
            <form onSubmit={handleSearch} className="mt-7 flex max-w-md shadow-sm">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search tomatoes, rice, mangoes…"
                className="input rounded-r-none focus:ring-2 focus:ring-leaf-500"
              />
              <button className="btn-primary rounded-l-none px-6">
                <Search size={18} />
              </button>
            </form>
            <div className="flex gap-3 mt-6">
              <Link to="/marketplace" className="btn-secondary">Browse marketplace</Link>
              <Link to="/register?role=farmer" className="btn-outline">Start selling as a farmer</Link>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="relative">
            <div className="card overflow-hidden shadow-xl border-forest-200 group">
              <div className="aspect-[16/10] relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80"
                  alt="Fresh farm harvest crate"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="badge bg-leaf-500 text-white self-start mb-2 font-medium">100% Direct From Farm</span>
                  <p className="font-display text-2xl font-bold">Today's Harvest: Fresh & Naturally Grown</p>
                  <p className="text-sm text-leaf-100 mt-1">Zero middlemen markups · Fair pricing directly to farmers</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-px bg-forest-100 text-xs">
                <div className="p-3 bg-white flex items-center gap-2">
                  <Leaf className="text-leaf-600 shrink-0" size={16} />
                  <span>Graded & Verified Stock</span>
                </div>
                <div className="p-3 bg-white flex items-center gap-2">
                  <Truck className="text-leaf-600 shrink-0" size={16} />
                  <span>Direct Farm Gate Dispatch</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Produce Category */}
      <section className="container-page py-12 border-b border-forest-100">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-semibold text-forest-900">Explore Fresh Categories</h2>
            <p className="text-forest-500 text-sm mt-1">Browse authentic seasonal produce straight from verified fields</p>
          </div>
          <Link to="/marketplace" className="text-sm font-medium text-leaf-700 flex items-center gap-1 hover:gap-2 transition-all">
            All categories <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {CATEGORY_CARDS.map((cat) => (
            <Link
              key={cat.key}
              to={`/marketplace?category=${cat.key}`}
              className="group card overflow-hidden hover:shadow-lg transition-all border border-forest-100"
            >
              <div className="aspect-[4/3] overflow-hidden relative">
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/70 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-2 text-white font-semibold text-sm leading-tight drop-shadow-sm">
                  {cat.name}
                </span>
              </div>
              <div className="p-2.5 bg-white">
                <p className="text-[11px] text-forest-500 truncate">{cat.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured produce */}
      <section className="container-page py-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-semibold text-forest-900">Featured this week</h2>
            <p className="text-forest-500 text-sm mt-1">Fresh listings from farms across the network</p>
          </div>
          <Link to="/marketplace" className="text-sm font-medium text-leaf-700 flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight size={16} />
          </Link>
        </div>
        {loading ? <Loader /> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {featured.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </section>

      {/* Upcoming harvests */}
      {harvests.length > 0 && (
        <section className="bg-forest-800 text-cream-100 py-14">
          <div className="container-page">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-semibold">Upcoming harvests — reserve early</h2>
                <p className="text-forest-300 text-sm mt-1">Pre-order before it's picked. Estimates, not guarantees.</p>
              </div>
              <Link to="/preorders" className="text-sm font-medium text-leaf-300 flex items-center gap-1 hover:gap-2 transition-all">
                See all <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {harvests.map((h) => {
                const harvestImg = getProductImage({ name: h.productName, category: h.category, image: h.image });
                return (
                  <Link key={h._id} to={`/preorders/${h._id}`} className="bg-forest-700/60 rounded-xl overflow-hidden hover:bg-forest-700 transition-colors flex flex-col group border border-forest-600/40">
                    <div className="aspect-[16/9] overflow-hidden relative">
                      <img
                        src={harvestImg}
                        alt={h.productName}
                        onError={(e) => handleImageFallback(e, h.category)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 right-2 badge bg-forest-900/80 text-leaf-300 text-xs">
                        Upcoming Harvest
                      </span>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <p className="font-semibold text-white text-lg">{h.productName}</p>
                      <p className="text-sm text-forest-300 mt-1">
                        Expected {new Date(h.expectedHarvestDate).toLocaleDateString()} (estimate)
                      </p>
                      <div className="mt-auto pt-3 border-t border-forest-600/50 flex items-center justify-between">
                        <span className="text-sm text-leaf-300 font-medium">₹{h.pricePerUnit}/{h.unit}</span>
                        <span className="text-xs text-forest-300">{Math.max(0, h.estimatedQuantity - h.quantityReserved)} left to reserve</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="container-page py-16">
        <h2 className="font-display text-2xl font-semibold text-forest-900 text-center mb-10">How AgriDirect works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { icon: Sprout, title: 'Farmers list produce', desc: 'With grade, harvest date, price and stock.' },
            { icon: Search, title: 'Buyers discover & compare', desc: 'Filter by category, price, freshness and farmer.' },
            { icon: ShieldCheck, title: 'Order securely', desc: 'Server-validated stock, transparent pricing, order tracking.' },
            { icon: TrendingUp, title: 'Everyone grows', desc: 'Farmers see real sales data; buyers get freshness and value.' },
          ].map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-leaf-50 flex items-center justify-center mb-3">
                <Icon className="text-leaf-600" size={24} />
              </div>
              <p className="font-semibold text-forest-900">{title}</p>
              <p className="text-sm text-forest-500 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="bg-leaf-50 py-14">
        <div className="container-page grid md:grid-cols-3 gap-6 text-center">
          <div className="card p-6">
            <ShieldCheck className="mx-auto text-leaf-600 mb-2" size={28} />
            <p className="font-semibold">Farmer verification</p>
            <p className="text-sm text-forest-500 mt-1">Badges only after admin-reviewed documentation.</p>
          </div>
          <div className="card p-6">
            <Users className="mx-auto text-leaf-600 mb-2" size={28} />
            <p className="font-semibold">Buyer reviews</p>
            <p className="text-sm text-forest-500 mt-1">Ratings restricted to real completed purchases.</p>
          </div>
          <div className="card p-6">
            <TrendingUp className="mx-auto text-leaf-600 mb-2" size={28} />
            <p className="font-semibold">Transparent pricing</p>
            <p className="text-sm text-forest-500 mt-1">Platform data, external references and estimates — clearly labeled.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
