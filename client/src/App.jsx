import React from 'react';
import { Routes, Route } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import { ProtectedRoute, RoleRoute } from './components/RouteGuards';

import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import Marketplace from './pages/public/Marketplace';
import ProductDetail from './pages/public/ProductDetail';
import PreOrdersList from './pages/public/PreOrdersList';
import PreOrderDetail from './pages/public/PreOrderDetail';
import GroupBuysList from './pages/public/GroupBuysList';
import GroupBuyDetail from './pages/public/GroupBuyDetail';
import { FarmerPublicProfile, NotFound } from './pages/public/MiscPublic';

import Cart from './pages/buyer/Cart';
import Checkout from './pages/buyer/Checkout';
import MyOrders from './pages/buyer/MyOrders';
import OrderDetail from './pages/buyer/OrderDetail';
import Notifications from './pages/buyer/Notifications';
import Profile from './pages/buyer/Profile';

import FarmerDashboard from './pages/farmer/FarmerDashboard';
import MyProducts from './pages/farmer/MyProducts';
import ProductForm from './pages/farmer/ProductForm';
import FarmerOrders from './pages/farmer/FarmerOrders';
import FarmerPreOrders from './pages/farmer/FarmerPreOrders';
import FarmerPriceInsights from './pages/farmer/FarmerPriceInsights';
import FarmerVerification from './pages/farmer/FarmerVerification';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVerifications from './pages/admin/AdminVerifications';
import AdminListings from './pages/admin/AdminListings';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminAuditLog from './pages/admin/AdminAuditLog';

export default function App() {
  return (
    <Routes>
      {/* Public + shared-auth pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/preorders" element={<PreOrdersList />} />
        <Route path="/preorders/:id" element={<PreOrderDetail />} />
        <Route path="/groupbuys" element={<GroupBuysList />} />
        <Route path="/groupbuys/:id" element={<GroupBuyDetail />} />
        <Route path="/farmers/:farmerId" element={<FarmerPublicProfile />} />

        {/* Buyer-facing, but reachable by any logged-in user */}
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Farmer dashboard */}
      <Route
        path="/farmer"
        element={<RoleRoute roles={['farmer']}><DashboardLayout role="farmer" /></RoleRoute>}
      >
        <Route index element={<FarmerDashboard />} />
        <Route path="products" element={<MyProducts />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="orders" element={<FarmerOrders />} />
        <Route path="preorders" element={<FarmerPreOrders />} />
        <Route path="price-insights" element={<FarmerPriceInsights />} />
        <Route path="verification" element={<FarmerVerification />} />
      </Route>

      {/* Admin dashboard */}
      <Route
        path="/admin"
        element={<RoleRoute roles={['admin']}><DashboardLayout role="admin" /></RoleRoute>}
      >
        <Route index element={<AdminDashboard />} />
        <Route path="verifications" element={<AdminVerifications />} />
        <Route path="listings" element={<AdminListings />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="audit-log" element={<AdminAuditLog />} />
      </Route>
    </Routes>
  );
}
