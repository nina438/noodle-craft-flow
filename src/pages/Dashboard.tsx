import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import {
  DollarSign, ShoppingCart, Wallet, PiggyBank,
  Apple, Warehouse, Package, Truck, Database
} from 'lucide-react';

const MODULES = [
  { path: '/cash-register', label: '錢櫃營收紀錄', desc: '每日現金清點與營收記錄', icon: DollarSign, color: 'bg-primary/10 text-primary' },
  { path: '/purchases', label: '進貨金額統計', desc: '供應商進貨及費用管理', icon: ShoppingCart, color: 'bg-accent/10 text-accent' },
  { path: '/petty-cash', label: '零用金支出紀錄', desc: '日常零用金支出追蹤', icon: Wallet, color: 'bg-warning/10 text-warning' },
  { path: '/reserve-fund', label: '預備金紀錄表', desc: '預備金收支及餘額管理', icon: PiggyBank, color: 'bg-info/10 text-info' },
  { path: '/daily-food', label: '每日食材盤點表', desc: '生鮮食材及乾貨每日盤點', icon: Apple, color: 'bg-success/10 text-success' },
  { path: '/daily-warehouse', label: '每日倉庫備品盤點表', desc: '倉庫備品庫存盤點', icon: Warehouse, color: 'bg-primary/10 text-primary' },
  { path: '/product-inventory', label: '販售商品盤點表', desc: '販售商品庫存盤點', icon: Package, color: 'bg-accent/10 text-accent' },
  { path: '/noodle-delivery', label: '麵廠送貨紀錄', desc: '麵廠出貨紀錄及追蹤', icon: Truck, color: 'bg-warning/10 text-warning' },
  { path: '/master-database', label: '商品主資料庫', desc: '所有商品庫存大總表', icon: Database, color: 'bg-info/10 text-info' },
];

export default function Dashboard() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="space-y-6">
      <div className="erp-gradient rounded-2xl p-6 lg:p-8 text-primary-foreground">
        <h2 className="text-xl lg:text-2xl font-bold">歡迎回來，{user?.name}</h2>
        <p className="text-primary-foreground/80 mt-1 text-sm">長安製麵 職人町 ERP 管理系統</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((mod, i) => (
          <Link key={mod.path} to={mod.path}>
            <Card className="erp-card-hover cursor-pointer border-border/50 h-full" style={{ animationDelay: `${i * 60}ms` }}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${mod.color} flex-shrink-0`}>
                    <mod.icon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">{mod.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{mod.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
