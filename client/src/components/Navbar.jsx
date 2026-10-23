import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, ShoppingCart, Bell, Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { notificationService } from '../services/miscServices';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount, refreshCart } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef(null);

  useEffect(() => {
    if (user?.role === 'buyer') refreshCart();
  }, [user]); // eslint-disable-line

  useEffect(() => {
    if (!user) return;
    const poll = async () => {
      try {
        const res = await notificationService.list();
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      } catch {
        /* ignore */
      }
    };
    poll();
    pollRef.current = setInterval(poll, 20000); // polling stand-in for real-time updates
    return () => clearInterval(pollRef.current);
  }, [user]);

  const dashboardLink = user?.role === 'admin' ? '/admin' : user?.role === 'farmer' ? '/farmer' : '/orders';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-cream-50/90 backdrop-blur border-b border-forest-100">
      <div className="container-page flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold text-forest-800">
          <Sprout className="text-leaf-600" size={26} />
          AgriDirect
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-forest-700">
          <Link to="/marketplace" className="hover:text-leaf-700">Marketplace</Link>
          <Link to="/preorders" className="hover:text-leaf-700">Upcoming Harvests</Link>
          <Link to="/groupbuys" className="hover:text-leaf-700">Group Buys</Link>
          {!user && <Link to="/register?role=farmer" className="hover:text-leaf-700">Sell on AgriDirect</Link>}
        </nav>

        <div className="flex items-center gap-2">
          {user && user.role === 'buyer' && (
            <Link to="/cart" className="relative p-2 rounded-lg hover:bg-forest-50">
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-leaf-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          )}

          {user && (
            <div className="relative">
              <button className="relative p-2 rounded-lg hover:bg-forest-50" onClick={() => setNotifOpen((o) => !o)}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 card p-2 max-h-96 overflow-auto">
                  <p className="px-2 py-1 text-xs font-semibold text-forest-500 uppercase">Notifications</p>
                  {notifications.length === 0 && <p className="px-2 py-4 text-sm text-forest-400">No notifications yet.</p>}
                  {notifications.map((n) => (
                    <div key={n._id} className={`px-2 py-2 rounded-lg text-sm ${!n.isRead ? 'bg-leaf-50' : ''}`}>
                      <p className="font-medium text-forest-800">{n.title}</p>
                      <p className="text-forest-500 text-xs mt-0.5">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="relative hidden sm:block">
              <button className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-forest-50" onClick={() => setMenuOpen((o) => !o)}>
                <div className="w-8 h-8 rounded-full bg-forest-700 text-white flex items-center justify-center text-sm font-semibold">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium">{user.name?.split(' ')[0]}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 card p-1.5" onMouseLeave={() => setMenuOpen(false)}>
                  <Link to={dashboardLink} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-forest-50">
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-forest-50">
                    <User size={16} /> Profile
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-red-50 text-red-600">
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" className="btn-outline btn-sm">Log in</Link>
              <Link to="/register" className="btn-primary btn-sm">Get started</Link>
            </div>
          )}

          <button className="md:hidden p-2" onClick={() => setMenuOpen((o) => !o)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-forest-100 px-4 py-3 flex flex-col gap-2 bg-white">
          <Link to="/marketplace" onClick={() => setMenuOpen(false)}>Marketplace</Link>
          <Link to="/preorders" onClick={() => setMenuOpen(false)}>Upcoming Harvests</Link>
          <Link to="/groupbuys" onClick={() => setMenuOpen(false)}>Group Buys</Link>
          {user ? (
            <>
              <Link to={dashboardLink} onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
              <button onClick={handleLogout} className="text-left text-red-600">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}>Get started</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
