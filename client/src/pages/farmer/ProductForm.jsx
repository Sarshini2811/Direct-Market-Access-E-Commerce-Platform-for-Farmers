import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productService } from '../../services/productService';

const CATEGORIES = ['vegetables', 'fruits', 'grains', 'pulses', 'dairy', 'spices', 'herbs', 'flowers', 'other'];
const UNITS = ['kg', 'g', 'quintal', 'ton', 'dozen', 'piece', 'litre', 'bunch'];
const GRADES = ['A', 'B', 'C', 'ungraded'];

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', category: 'vegetables', variety: '', grade: 'A', unit: 'kg',
    price: '', quantityAvailable: '', description: '', harvestDate: '', expiryOrFreshUntil: '',
    wholesaleEnabled: false, wholesaleMinQty: '', wholesalePrice: '',
    pickup: true, delivery: false, deliveryFee: '', estimatedDays: '2',
  });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const res = await productService.get(id);
      const p = res.data.product;
      setForm({
        name: p.name, category: p.category, variety: p.variety || '', grade: p.grade, unit: p.unit,
        price: p.price, quantityAvailable: p.quantityAvailable, description: p.description || '',
        harvestDate: p.harvestDate ? p.harvestDate.slice(0, 10) : '',
        expiryOrFreshUntil: p.expiryOrFreshUntil ? p.expiryOrFreshUntil.slice(0, 10) : '',
        wholesaleEnabled: p.wholesale?.enabled || false,
        wholesaleMinQty: p.wholesale?.minQuantity || '', wholesalePrice: p.wholesale?.pricePerUnit || '',
        pickup: p.deliveryOptions?.pickup ?? true, delivery: p.deliveryOptions?.delivery ?? false,
        deliveryFee: p.deliveryOptions?.deliveryFee || '', estimatedDays: p.deliveryOptions?.estimatedDays || '2',
      });
      setExistingImages(p.images || []);
    })();
  }, [id, isEdit]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('category', form.category);
      fd.append('variety', form.variety);
      fd.append('grade', form.grade);
      fd.append('unit', form.unit);
      fd.append('price', form.price);
      fd.append('quantityAvailable', form.quantityAvailable);
      fd.append('description', form.description);
      if (form.harvestDate) fd.append('harvestDate', form.harvestDate);
      if (form.expiryOrFreshUntil) fd.append('expiryOrFreshUntil', form.expiryOrFreshUntil);
      fd.append('wholesale', JSON.stringify({
        enabled: form.wholesaleEnabled,
        minQuantity: form.wholesaleEnabled ? Number(form.wholesaleMinQty) || 0 : 0,
        pricePerUnit: form.wholesaleEnabled ? Number(form.wholesalePrice) || 0 : 0,
      }));
      fd.append('deliveryOptions', JSON.stringify({
        pickup: form.pickup,
        delivery: form.delivery,
        deliveryFee: form.delivery ? Number(form.deliveryFee) || 0 : 0,
        estimatedDays: Number(form.estimatedDays) || 1,
      }));
      images.forEach((img) => fd.append('images', img));

      if (isEdit) await productService.update(id, fd);
      else await productService.create(fd);

      navigate('/farmer/products');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-forest-900 mb-5">{isEdit ? 'Edit produce' : 'Add produce'}</h1>
      <form onSubmit={submit} className="card p-6 space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div>
          <label className="label">Product name</label>
          <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Unit</label>
            <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Grade</label>
            <select className="input" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Retail price (₹)</label>
            <input required type="number" min="0" step="0.01" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label className="label">Quantity available</label>
            <input required type="number" min="0" className="input" value={form.quantityAvailable} onChange={(e) => setForm({ ...form, quantityAvailable: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Harvest date</label>
            <input type="date" className="input" value={form.harvestDate} onChange={(e) => setForm({ ...form, harvestDate: e.target.value })} />
          </div>
          <div>
            <label className="label">Fresh until</label>
            <input type="date" className="input" value={form.expiryOrFreshUntil} onChange={(e) => setForm({ ...form, expiryOrFreshUntil: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="card p-4 bg-forest-50/50">
          <label className="flex items-center gap-2 text-sm font-medium mb-2">
            <input type="checkbox" checked={form.wholesaleEnabled} onChange={(e) => setForm({ ...form, wholesaleEnabled: e.target.checked })} />
            Enable wholesale / bulk pricing
          </label>
          {form.wholesaleEnabled && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <input type="number" min="0" placeholder="Min quantity" className="input" value={form.wholesaleMinQty} onChange={(e) => setForm({ ...form, wholesaleMinQty: e.target.value })} />
              <input type="number" min="0" placeholder="Bulk price/unit" className="input" value={form.wholesalePrice} onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })} />
            </div>
          )}
        </div>

        <div className="card p-4 bg-forest-50/50">
          <p className="text-sm font-medium mb-2">Delivery options</p>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.pickup} onChange={(e) => setForm({ ...form, pickup: e.target.checked })} /> Pickup</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.delivery} onChange={(e) => setForm({ ...form, delivery: e.target.checked })} /> Delivery</label>
          </div>
          {form.delivery && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <input type="number" min="0" placeholder="Delivery fee (₹)" className="input" value={form.deliveryFee} onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })} />
              <input type="number" min="0" placeholder="Est. days" className="input" value={form.estimatedDays} onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })} />
            </div>
          )}
        </div>

        <div>
          <label className="label">Cover Images (up to 6)</label>
          <div className="flex gap-2 mb-3 flex-wrap">
            {existingImages.map((img, i) => (
              <img key={`existing-${i}`} src={img} className="w-16 h-16 rounded-lg object-cover border border-forest-200 shadow-sm" alt="Existing" />
            ))}
            {images.map((file, i) => (
              <div key={`new-${i}`} className="relative">
                <img src={URL.createObjectURL(file)} className="w-16 h-16 rounded-lg object-cover border-2 border-leaf-500 shadow-sm" alt="New upload preview" />
                <span className="absolute -top-1 -right-1 bg-leaf-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span>
              </div>
            ))}
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImages([...e.target.files])}
            className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-leaf-100 file:text-leaf-800 hover:file:bg-leaf-200 cursor-pointer"
          />
          <p className="text-xs text-forest-400 mt-1">Upload high quality photos of your freshly harvested produce.</p>
        </div>

        <button className="btn-primary w-full" disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Save changes' : 'Publish listing'}</button>
      </form>
    </div>
  );
}
