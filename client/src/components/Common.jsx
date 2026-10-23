import React from 'react';
import { Loader2, Inbox } from 'lucide-react';

export function Loader({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-forest-500">
      <Loader2 className="animate-spin" size={20} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-14 h-14 rounded-full bg-leaf-50 flex items-center justify-center mb-4">
        <Icon size={26} className="text-leaf-600" />
      </div>
      <h3 className="font-display text-lg font-semibold text-forest-800">{title}</h3>
      {description && <p className="text-sm text-forest-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

const STATUS_STYLES = {
  placed: 'bg-amber-50 text-amber-700',
  accepted: 'bg-blue-50 text-blue-700',
  packed: 'bg-indigo-50 text-indigo-700',
  dispatched: 'bg-purple-50 text-purple-700',
  delivered: 'bg-leaf-100 text-leaf-800',
  cancelled: 'bg-red-50 text-red-700',
  rejected: 'bg-red-50 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-50 text-amber-700',
  verified: 'bg-leaf-100 text-leaf-800',
  unverified: 'bg-gray-100 text-gray-600',
  paid: 'bg-leaf-100 text-leaf-800',
  failed: 'bg-red-50 text-red-700',
  open: 'bg-blue-50 text-blue-700',
  upcoming: 'bg-amber-50 text-amber-700',
  target_reached: 'bg-leaf-100 text-leaf-800',
  expired: 'bg-gray-100 text-gray-600',
  fulfilled: 'bg-leaf-100 text-leaf-800',
  active: 'bg-leaf-100 text-leaf-800',
  suspended: 'bg-amber-50 text-amber-700',
  banned: 'bg-red-50 text-red-700',
};

export function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-700';
  return <span className={`badge ${style} capitalize`}>{status?.replace('_', ' ')}</span>;
}

const ACCENT_STYLES = {
  forest: 'bg-forest-50 text-forest-600',
  leaf: 'bg-leaf-50 text-leaf-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  blue: 'bg-blue-50 text-blue-600',
};

export function KpiCard({ label, value, icon: Icon, sub, accent = 'forest' }) {
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-forest-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-display font-semibold text-forest-900 mt-1">{value}</p>
        {sub && <p className="text-xs text-forest-400 mt-1">{sub}</p>}
      </div>
      {Icon && (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${ACCENT_STYLES[accent] || ACCENT_STYLES.forest}`}>
          <Icon size={20} />
        </div>
      )}
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button className="btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span className="text-sm text-forest-600 px-2">
        Page {page} of {totalPages}
      </span>
      <button className="btn-outline btn-sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
