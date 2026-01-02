import { useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { DashboardSidebar } from "./components/DashboardSidebar";
import { DashboardTopbar } from "./components/DashboardTopbar";
import { DashboardOverview } from "./components/DashboardOverview";
import { ProductsManagement } from "./components/ProductsManagement";
import { ProductDetail } from "./components/ProductDetail";
import { OrdersManagement } from "./components/OrdersManagement";
import { OrderDetail } from "./components/OrderDetail";
import { CustomersManagement } from "./components/CustomersManagement";
import { CustomerDetail } from "./components/CustomerDetail";
import { SuppliersManagement } from "./components/SuppliersManagement";
import { SupplierDetail } from "./components/SupplierDetail";
import { StockManagement } from "./components/StockManagement";
import { DiscountsManagement } from "./components/DiscountsManagement";
import { NotificationsManagement } from "./components/NotificationsManagement";
import { UserSettings } from "./components/UserSettings";
import { SizeChartManagement } from "./components/SizeChartManagement";
import { CategoryManagement } from "./components/CategoryManagement";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Get the current section from the pathname
  const getActiveSection = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path.startsWith('/products')) return 'products';
    if (path.startsWith('/orders')) return 'orders';
    if (path.startsWith('/customers')) return 'customers';
    if (path.startsWith('/suppliers')) return 'suppliers';
    if (path.startsWith('/stock')) return 'stock';
    if (path.startsWith('/discounts')) return 'discounts';
    if (path.startsWith('/sizecharts')) return 'sizecharts';
    if (path.startsWith('/categories')) return 'categories';
    if (path.startsWith('/notifications')) return 'notifications';
    if (path.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  return (
    <div className="min-h-screen bg-white flex">
      <DashboardSidebar
        activeSection={getActiveSection()}
        isCollapsed={isSidebarCollapsed}
      />
      <div className="flex-1 flex flex-col">
        <DashboardTopbar
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main className={`flex-1 overflow-auto transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-0' : 'ml-0'
        }`}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardOverview />} />
            <Route path="/products" element={<ProductsManagement />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/orders" element={<OrdersManagement />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/customers" element={<CustomersManagement />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/suppliers" element={<SuppliersManagement />} />
            <Route path="/suppliers/:id" element={<SupplierDetail />} />
            <Route path="/stock" element={<StockManagement />} />
            <Route path="/discounts" element={<DiscountsManagement />} />
            <Route path="/sizecharts" element={<SizeChartManagement />} />
            <Route path="/categories" element={<CategoryManagement />} />
            <Route path="/notifications" element={<NotificationsManagement />} />
            <Route path="/settings" element={<UserSettings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      <Toaster />
    </div>
  );
}