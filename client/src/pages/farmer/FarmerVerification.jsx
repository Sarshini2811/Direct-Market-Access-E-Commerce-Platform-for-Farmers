import React, { useEffect, useState } from 'react';
import { BadgeCheck, Upload } from 'lucide-react';
import { farmerService } from '../../services/productService';
import { StatusBadge, Loader } from '../../components/Common';

export default function FarmerVerification() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ farmName: '', farmingType: '', bio: '', yearsFarming: '', district: '', state: '', pincode: '' });
  const [msg, setMsg] = useState('');
  const [docName, setDocName] = useState('');
  const [note, setNote] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await farmerService.myProfile();
      const p = res.data.profile;
      setProfile(p);
      setForm({
        farmName: p.farmName, farmingType: p.farmingType || '', bio: p.bio || '',
        yearsFarming: p.yearsFarming || '', district: p.location?.district || '',
        state: p.location?.state || '', pincode: p.location?.pincode || '',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await farmerService.updateProfile({
        farmName: form.farmName, farmingType: form.farmingType, bio: form.bio,
        yearsFarming: Number(form.yearsFarming) || 0,
        location: { district: form.district, state: form.state, pincode: form.pincode },
      });
      setMsg('Farm profile updated');
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const submitVerification = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const documents = docName ? [{ name: docName, url: `/uploads/placeholder-${Date.now()}.pdf` }] : [];
      await farmerService.submitVerification({ documents, farmerNote: note });
      setMsg('Verification request submitted for admin review.');
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-forest-900 flex items-center gap-2">
          <BadgeCheck className="text-leaf-600" /> Farm Profile & Verification
        </h1>
        <StatusBadge status={profile?.verificationStatus} />
      </div>
      {msg && <p className="text-sm text-leaf-700">{msg}</p>}

      <form onSubmit={saveProfile} className="card p-6 space-y-3">
        <p className="font-medium mb-1">Farm details</p>
        <input className="input" placeholder="Farm name" value={form.farmName} onChange={(e) => setForm({ ...form, farmName: e.target.value })} />
        <input className="input" placeholder="Farming type (organic / conventional / mixed)" value={form.farmingType} onChange={(e) => setForm({ ...form, farmingType: e.target.value })} />
        <textarea className="input" rows={3} placeholder="Short bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        <div className="grid grid-cols-3 gap-2">
          <input className="input" placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          <input className="input" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <input className="input" placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
        </div>
        <input type="number" min="0" className="input" placeholder="Years farming" value={form.yearsFarming} onChange={(e) => setForm({ ...form, yearsFarming: e.target.value })} />
        <button className="btn-primary">Save farm profile</button>
      </form>

      {profile?.verificationStatus !== 'verified' && (
        <form onSubmit={submitVerification} className="card p-6 space-y-3">
          <p className="font-medium mb-1">Submit for verification</p>
          <p className="text-xs text-forest-400">
            An admin reviews your submission before a verification badge appears on your listings.
            {profile?.verificationStatus === 'pending' && ' Your request is currently pending review.'}
          </p>
          <label className="label flex items-center gap-2"><Upload size={14} /> Supporting document name</label>
          <input className="input" placeholder="e.g. Land ownership record" value={docName} onChange={(e) => setDocName(e.target.value)} />
          <textarea className="input" rows={2} placeholder="Note for the admin (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn-secondary" disabled={profile?.verificationStatus === 'pending'}>
            {profile?.verificationStatus === 'pending' ? 'Pending review' : 'Submit for verification'}
          </button>
        </form>
      )}
    </div>
  );
}
