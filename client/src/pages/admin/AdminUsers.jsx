import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/miscServices';
import { Loader, EmptyState, StatusBadge, Pagination } from '../../components/Common';

export default function AdminUsers() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.users({ page, limit: 15, ...(role ? { role } : {}), ...(q ? { q } : {}) });
      setItems(res.data);
      setMeta(res.meta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, [role]); // eslint-disable-line

  const changeStatus = async (id, accountStatus) => {
    await adminService.updateUserStatus(id, accountStatus);
    load(meta.page);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-forest-900">Users</h1>
        <div className="flex gap-2">
          <input className="input w-48" placeholder="Search name/email" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load(1)} />
          <select className="input w-36" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="farmer">Farmer</option>
            <option value="buyer">Buyer</option>
          </select>
        </div>
      </div>

      {items.length === 0 ? <EmptyState title="No users found" /> : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-forest-50 text-forest-500 text-xs uppercase">
                <tr><th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">Email</th><th className="text-left px-4 py-3">Role</th><th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Action</th></tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u._id} className="border-t border-forest-50">
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3 capitalize">{u.role}</td>
                    <td className="px-4 py-3"><StatusBadge status={u.accountStatus} /></td>
                    <td className="px-4 py-3 text-right space-x-1">
                      {u.accountStatus !== 'suspended' && <button onClick={() => changeStatus(u._id, 'suspended')} className="btn-outline btn-sm">Suspend</button>}
                      {u.accountStatus !== 'active' && <button onClick={() => changeStatus(u._id, 'active')} className="btn-outline btn-sm">Reactivate</button>}
                      {u.accountStatus !== 'banned' && <button onClick={() => changeStatus(u._id, 'banned')} className="btn-outline btn-sm text-red-600">Ban</button>}
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
