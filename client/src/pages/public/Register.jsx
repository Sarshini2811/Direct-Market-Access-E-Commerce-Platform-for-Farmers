import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sprout, Sprout as FarmerIcon, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRole = params.get('role') === 'farmer' ? 'farmer' : 'buyer';

  const [role, setRole] = useState(initialRole);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      const user = await register({ ...form, role });
      navigate(user.role === 'farmer' ? '/farmer' : '/marketplace', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-cream-100 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-semibold text-forest-800">
            <Sprout className="text-leaf-600" /> AgriDirect
          </Link>
          <p className="text-forest-500 text-sm mt-2">Create your account</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setRole('buyer')}
            className={`card p-3 flex flex-col items-center gap-1 text-sm font-medium ${role === 'buyer' ? 'ring-2 ring-leaf-500' : ''}`}
          >
            <ShoppingBag size={18} className="text-leaf-600" /> Buyer / Retailer
          </button>
          <button
            type="button"
            onClick={() => setRole('farmer')}
            className={`card p-3 flex flex-col items-center gap-1 text-sm font-medium ${role === 'farmer' ? 'ring-2 ring-leaf-500' : ''}`}
          >
            <FarmerIcon size={18} className="text-leaf-600" /> Farmer
          </button>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="label">Full name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9xxxxxxxxx" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 characters" />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account…' : `Create ${role} account`}
          </button>
          <p className="text-center text-sm text-forest-500">
            Already have an account? <Link to="/login" className="text-leaf-700 font-medium">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
