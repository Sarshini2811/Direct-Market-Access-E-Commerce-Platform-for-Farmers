import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '',
    line1: user?.address?.line1 || '', city: user?.address?.city || '',
    state: user?.address?.state || '', pincode: user?.address?.pincode || '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const saveProfile = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await authService.updateMe({
        name: form.name,
        phone: form.phone,
        address: { line1: form.line1, city: form.city, state: form.state, pincode: form.pincode },
      });
      updateUser(res.data.user);
      setMsg('Profile updated');
    } catch (err) {
      setMsg(err.message);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');
    try {
      await authService.changePassword(pwForm);
      setPwMsg('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPwMsg(err.message);
    }
  };

  return (
    <div className="container-page py-8 max-w-xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-forest-900">My Profile</h1>

      <form onSubmit={saveProfile} className="card p-6 space-y-4">
        <p className="font-medium">Basic details</p>
        {msg && <p className="text-sm text-leaf-700">{msg}</p>}
        <div>
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className="input" placeholder="Address line" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
          <input className="input" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className="input" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <input className="input" placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
        </div>
        <button className="btn-primary">Save changes</button>
      </form>

      <form onSubmit={changePassword} className="card p-6 space-y-4">
        <p className="font-medium">Change password</p>
        {pwMsg && <p className="text-sm text-leaf-700">{pwMsg}</p>}
        <input type="password" required className="input" placeholder="Current password" value={pwForm.currentPassword}
          onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
        <input type="password" required className="input" placeholder="New password (min 8 chars)" value={pwForm.newPassword}
          onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
        <button className="btn-outline">Update password</button>
      </form>
    </div>
  );
}
