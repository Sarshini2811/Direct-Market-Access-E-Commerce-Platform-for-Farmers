import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/miscServices';
import { Loader, EmptyState, Pagination } from '../../components/Common';

export default function AdminListings() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState('');

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.listings({ page, limit: 15, ...(active !== '' ? { active } : {}) });
      setItems(res.data);
      setMeta(res.meta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, [active]); // eslint-disable-line

  const toggle = async (id, isActive) => {
    await adminService.moderateListing(id, isActive);
    load(meta.page);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-forest-900">Listing Moderation</h1>
        <select className="input w-44" value={active} onChange={(e) => setActive(e.target.value)}>
          <option value="">All listings</option>
          <option value="true">Active only</option>
          <option value="false">Removed only</option>
        </select>
      </div>

      {items.length === 0 ? <EmptyState title="No listings found" /> : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-forest-50 text-forest-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Product</th>
                  <th className="text-left px-4 py-3">Farmer</th>
                  <th className="text-left px-4 py-3">Price</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id} className="border-t border-forest-50">
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3">{p.farmer?.name}</td>
                    <td className="px-4 py-3">₹{p.price}/{p.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${p.isActive ? 'bg-leaf-100 text-leaf-800' : 'bg-gray-100 text-gray-600'}`}>{p.isActive ? 'Active' : 'Removed'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggle(p._id, !p.isActive)} className="btn-outline btn-sm">
                        {p.isActive ? 'Remove' : 'Restore'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={meta.page} totalPages={meta.totalPages} onChange={load} />
        </>
      )}
    </div>
  );
}
