import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-forest-900 text-cream-100 mt-20">
      <div className="container-page py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2 font-display text-lg font-semibold">
            <Sprout className="text-leaf-400" size={22} /> AgriDirect
          </div>
          <p className="text-forest-300 text-sm mt-3 max-w-xs">
            Connecting farmers directly with consumers, retailers, restaurants and wholesalers —
            transparent pricing, fewer intermediaries, fresher produce.
          </p>
        </div>
        <div>
          <p className="font-semibold text-sm mb-3">Marketplace</p>
          <ul className="space-y-2 text-sm text-forest-300">
            <li><Link to="/marketplace">Browse produce</Link></li>
            <li><Link to="/preorders">Upcoming harvests</Link></li>
            <li><Link to="/groupbuys">Group buys</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-sm mb-3">For Farmers</p>
          <ul className="space-y-2 text-sm text-forest-300">
            <li><Link to="/register?role=farmer">Start selling</Link></li>
            <li><Link to="/login">Farmer login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-forest-800 py-4 text-center text-xs text-forest-400">
        © {new Date().getFullYear()} AgriDirect. A direct market access platform for farmers — demo project.
      </div>
    </footer>
  );
}
