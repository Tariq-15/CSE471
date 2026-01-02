import { Link, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Users, 
  Ruler, 
  Percent, 
  Settings,
  Home,
  Folder
} from "lucide-react";
import { cn } from "./ui/utils";

interface DashboardSidebarProps {
  activeSection: string;
  isCollapsed: boolean;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
  { id: 'products', label: 'Products', icon: Package, path: '/products' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, path: '/orders' },
  { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
  { id: 'categories', label: 'Categories', icon: Folder, path: '/categories' },
  { id: 'sizecharts', label: 'Size Charts', icon: Ruler, path: '/sizecharts' },
  { id: 'discounts', label: 'Discounts', icon: Percent, path: '/discounts' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export function DashboardSidebar({ activeSection, isCollapsed }: DashboardSidebarProps) {
  const location = useLocation();

  return (
    <aside 
      className={cn(
        "bg-[#F8F5EE] border-r border-gray-200 transition-all duration-300 flex-shrink-0",
        isCollapsed ? "w-16" : "w-64"
      )}
      style={{ minHeight: '100vh' }}
    >
      <div className="p-4">
        <Link to="/dashboard" className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-[#576D64] rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-semibold text-black">Unleashed</span>
          )}
        </Link>
        
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                           (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.id}
                to={item.path}
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
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}