import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, DollarSign, ShoppingCart, Wallet, PiggyBank,
  Apple, Warehouse, Package, Truck, Database, BarChart3,
  LogOut, Menu, X, ChevronRight, User
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: '首頁總覽', icon: LayoutDashboard },
  { path: '/cash-register', label: '錢櫃營收紀錄', icon: DollarSign },
  { path: '/purchases', label: '進貨金額統計', icon: ShoppingCart },
  { path: '/petty-cash', label: '零用金支出紀錄', icon: Wallet },
  { path: '/reserve-fund', label: '預備金紀錄表', icon: PiggyBank },
  { path: '/daily-food', label: '每日食材盤點表', icon: Apple },
  { path: '/daily-warehouse', label: '每日倉庫備品盤點表', icon: Warehouse },
  { path: '/product-inventory', label: '販售商品盤點表', icon: Package },
  { path: '/noodle-delivery', label: '麵廠送貨紀錄', icon: Truck },
  { path: '/master-database', label: '商品主資料庫', icon: Database },
  { path: '/monthly-report', label: '每月統計報表', icon: BarChart3, adminOnly: true },
];

const ROLE_LABELS = { admin: '管理員', manager: '店長', staff: '員工' };

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 sidebar-gradient flex flex-col
        transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl erp-gradient flex items-center justify-center shadow-md">
              <span className="text-lg font-bold text-primary-foreground">長</span>
            </div>
            <div>
              <h2 className="font-bold text-sidebar-foreground text-sm">長安製麵</h2>
              <p className="text-xs text-sidebar-foreground/60">職人町 ERP</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {filteredNav.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center">
              <User className="w-4 h-4 text-sidebar-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/50">{ROLE_LABELS[user?.role || 'staff']}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            <LogOut className="w-4 h-4 mr-2" />登出
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 glass-effect border-b border-border px-4 lg:px-6 h-14 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-muted">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground truncate">
            {filteredNav.find(n => n.path === location.pathname)?.label || '職人町 ERP'}
          </h1>
        </header>
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
