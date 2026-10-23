import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Sprout, TrendingUp, BadgeCheck,
  Bell, Users, Flag, ScrollText, ChevronLeft, ChevronRight, LogOut, Menu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FARMER_NAV = [
  { to: '/farmer', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/farmer/products', label: 'My Produce', icon: Package },
  { to: '/farmer/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/farmer/preorders', label: 'Smart Harvest', icon: Sprout },
  { to: '/farmer/price-insights', label: 'Price Insights', icon: TrendingUp },
  { to: '/farmer/verification', label: 'Verification', icon: BadgeCheck },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/verifications', label: 'Verifications', icon: BadgeCheck },
  { to: '/admin/listings', label: 'Listings', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
  { to: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
];

export default function DashboardLayout({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = role === 'admin' ? ADMIN_NAV : FARMER_NAV;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-cream-100">
      <aside
        className={`hidden md:flex flex-col bg-forest-900 text-cream-100 transition-all duration-200 ${
          collapsed ? 'w-[76px]' : 'w-64'
        } shrink-0`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-forest-800">
          {!collapsed && (
            <span className="font-display font-semibold flex items-center gap-2">
              <Sprout className="text-leaf-400" size={20} /> AgriDirect
            </span>
          )}
          <button onClick={() => setCollapsed((c) => !c)} className="p-1 rounded hover:bg-forest-800">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-leaf-600 text-white' : 'text-forest-200 hover:bg-forest-800'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-forest-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-forest-200 hover:bg-forest-800">
            <LogOut size={18} /> {!collapsed && 'Log out'}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-forest-900 text-cream-100 p-4">
            <nav className="space-y-1 mt-4">
              {items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-leaf-600 text-white' : 'text-forest-200'
                    }`
                  }
                >
                  <Icon size={18} /> {label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-forest-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
          <button className="md:hidden p-2" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <h1 className="font-display font-semibold text-lg capitalize hidden md:block">{role} Dashboard</h1>
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-forest-500" />
            <div className="w-8 h-8 rounded-full bg-forest-700 text-white flex items-center justify-center text-sm font-semibold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
