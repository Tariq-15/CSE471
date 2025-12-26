import { useState } from "react";
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
import { Analytics } from "./components/Analytics";
import { StockManagement } from "./components/StockManagement";
import { DiscountsManagement } from "./components/DiscountsManagement";
import { SizeChartManagement } from "./components/SizeChartManagement";
import { UserSettings } from "./components/UserSettings";

export default function App() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardOverview />;
      case "products":
        if (selectedProductId) {
          return <ProductDetail productId={selectedProductId} onBack={() => setSelectedProductId(null)} />;
        }
        return <ProductsManagement onViewProduct={setSelectedProductId} />;
      case "orders":
        if (selectedOrderId) {
          return <OrderDetail orderId={selectedOrderId} onBack={() => setSelectedOrderId(null)} />;
        }
        return <OrdersManagement onViewOrder={setSelectedOrderId} />;
      case "customers":
        if (selectedCustomerId) {
          return <CustomerDetail customerId={selectedCustomerId} onBack={() => setSelectedCustomerId(null)} />;
        }
        return <CustomersManagement onViewCustomer={setSelectedCustomerId} />;
      case "suppliers":
        if (selectedSupplierId) {
          return <SupplierDetail supplierId={selectedSupplierId} onBack={() => setSelectedSupplierId(null)} />;
        }
        return <SuppliersManagement onViewSupplier={setSelectedSupplierId} />;
      case "analytics":
        return <Analytics />;
      case "stock":
        return <StockManagement />;
      case "sizecharts":
        return <SizeChartManagement />;
      case "discounts":
        return <DiscountsManagement />;
      case "settings":
        return <UserSettings />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <DashboardSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isCollapsed={isSidebarCollapsed}
      />
      <div className="flex-1 flex flex-col">
        <DashboardTopbar
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onSectionChange={setActiveSection}
        />
        <main className={`flex-1 overflow-auto transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-0' : 'ml-0'
        }`}>
          {renderSection()}
        </main>
      </div>
    </div>
  );
}