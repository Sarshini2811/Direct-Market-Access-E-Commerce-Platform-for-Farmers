import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const dest = location.state?.from?.pathname || (user.role === 'admin' ? '/admin' : user.role === 'farmer' ? '/farmer' : '/marketplace');
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-cream-100 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-semibold text-forest-800">
            <Sprout className="text-leaf-600" /> AgriDirect
          </Link>
          <p className="text-forest-500 text-sm mt-2">Log in to your account</p>
        </div>
        <form onSubmit={submit} className="card p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required className="input" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </div>
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in…' : 'Log in'}</button>
          <p className="text-center text-sm text-forest-500">
            New here? <Link to="/register" className="text-leaf-700 font-medium">Create an account</Link>
          </p>
        </form>
        <div className="card p-4 mt-4 text-xs text-forest-500">
          <p className="font-semibold text-forest-700 mb-1">Demo accounts (after running the seed script):</p>
          <p>Admin: admin@farmmarket.demo / Admin@12345</p>
          <p>Farmer: murugan@farmmarket.demo / Farmer@12345</p>
          <p>Buyer: priya@buyer.demo / Buyer@12345</p>
        </div>
      </div>
    </div>
  );
}
