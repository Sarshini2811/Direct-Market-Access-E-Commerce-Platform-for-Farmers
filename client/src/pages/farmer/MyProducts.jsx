import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { productService } from '../../services/productService';
import { Loader, EmptyState } from '../../components/Common';
import { getProductImage, handleImageFallback } from '../../utils/productImages';

export default function MyProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await productService.mine();
      setProducts(res.data.products);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm('Remove this listing from the marketplace?')) return;
    try {
      await productService.remove(id);
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const toggleSurplus = async (product) => {
    const percent = product.isSurplusDiscount ? 0 : Number(window.prompt('Discount percent for surplus listing (1-90):', '15'));
    if (product.isSurplusDiscount === false && (!percent || percent < 1)) return;
    try {
      const res = await productService.updateStock(product._id, {
        isSurplusDiscount: !product.isSurplusDiscount,
        surplusDiscountPercent: percent || 0,
      });
      setProducts((prev) => prev.map((p) => (p._id === product._id ? res.data.product : p)));
    } catch (err) {
      setMsg(err.message);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-forest-900">My Produce</h1>
        <Link to="/farmer/products/new" className="btn-primary"><Plus size={16} /> Add produce</Link>
      </div>
      {msg && <p className="text-sm text-red-600">{msg}</p>}

      {products.length === 0 ? (
        <EmptyState icon={Package} title="No listings yet" description="Add your first produce listing to start selling." action={<Link to="/farmer/products/new" className="btn-primary">Add produce</Link>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-forest-50 text-forest-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Stock (avail / reserved)</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-t border-forest-50">
                  <td className="px-4 py-3 flex items-center gap-2">
                    <div className="w-10 h-10 rounded bg-leaf-50 overflow-hidden shrink-0 border border-forest-100">
                      <img
                        src={getProductImage(p)}
                        onError={(e) => handleImageFallback(e, p.category)}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    </div>
                    <span className="font-medium text-forest-900">{p.name}</span>
                  </td>
                  <td className="px-4 py-3">₹{p.price}/{p.unit}</td>
                  <td className="px-4 py-3">{p.quantityAvailable} / {p.quantityReserved}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${p.isActive ? 'bg-leaf-100 text-leaf-800' : 'bg-gray-100 text-gray-600'}`}>{p.isActive ? 'Active' : 'Removed'}</span>
                    {p.isSurplusDiscount && <span className="badge bg-amber-100 text-amber-700 ml-1">Surplus {p.surplusDiscountPercent}%</span>}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button onClick={() => toggleSurplus(p)} className="btn-outline btn-sm">{p.isSurplusDiscount ? 'Unmark surplus' : 'Mark surplus'}</button>
                    <Link to={`/farmer/products/${p._id}/edit`} className="btn-outline btn-sm inline-flex"><Pencil size={14} /></Link>
                    {p.isActive && <button onClick={() => remove(p._id)} className="btn-outline btn-sm text-red-600"><Trash2 size={14} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
