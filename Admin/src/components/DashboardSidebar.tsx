import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Archive, 
  Percent, 
  Settings,
  Home,
  Truck
} from "lucide-react";
import { cn } from "./ui/utils";

interface DashboardSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isCollapsed: boolean;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'suppliers', label: 'Suppliers', icon: Truck },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'stock', label: 'Stock', icon: Archive },
  { id: 'discounts', label: 'Discounts', icon: Percent },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function DashboardSidebar({ activeSection, onSectionChange, isCollapsed }: DashboardSidebarProps) {
  return (
    <aside 
      className={cn(
        "bg-[#F8F5EE] border-r border-gray-200 transition-all duration-300 flex-shrink-0",
        isCollapsed ? "w-16" : "w-64"
      )}
      style={{ minHeight: '100vh' }}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-[#576D64] rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-semibold text-black">Unleashed</span>
          )}
        </div>
        
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive 
                    ? "bg-[#576D64] text-white" 
                    : "text-gray-700 hover:bg-[#AAC0B5] hover:text-white"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}