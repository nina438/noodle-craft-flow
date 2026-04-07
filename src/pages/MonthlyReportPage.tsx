import { useMemo } from 'react';
import { getStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import type { CashRegisterRecord, PurchaseRecord, PettyCashRecord } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Navigate } from 'react-router-dom';

const COLORS = ['hsl(25,60%,42%)', 'hsl(160,30%,40%)', 'hsl(40,90%,55%)', 'hsl(210,60%,50%)', 'hsl(0,65%,52%)'];

export default function MonthlyReportPage() {
  const { isAdmin } = useAuth();
  const cashRecords = useMemo(() => getStore<CashRegisterRecord>('cash_register'), []);
  const purchaseRecords = useMemo(() => getStore<PurchaseRecord>('purchases'), []);
  const pettyCashRecords = useMemo(() => getStore<PettyCashRecord>('petty_cash'), []);

  if (!isAdmin) return <Navigate to="/" replace />;

  const monthlyRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    cashRecords.forEach(r => {
      const m = r.date.slice(0, 7);
      map[m] = (map[m] || 0) + r.totalRevenue;
    });
    return Object.entries(map).map(([month, revenue]) => ({ month, revenue })).sort((a, b) => a.month.localeCompare(b.month));
  }, [cashRecords]);

  const monthlyPurchases = useMemo(() => {
    const map: Record<string, number> = {};
    purchaseRecords.forEach(r => {
      const m = r.date.slice(0, 7);
      map[m] = (map[m] || 0) + r.totalAmount;
    });
    return Object.entries(map).map(([month, amount]) => ({ month, amount })).sort((a, b) => a.month.localeCompare(b.month));
  }, [purchaseRecords]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    pettyCashRecords.forEach(r => {
      const cat = r.category || '未分類';
      map[cat] = (map[cat] || 0) + r.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [pettyCashRecords]);

  const totalRevenue = cashRecords.reduce((s, r) => s + r.totalRevenue, 0);
  const totalPurchases = purchaseRecords.reduce((s, r) => s + r.totalAmount, 0);
  const totalPettyCash = pettyCashRecords.reduce((s, r) => s + r.amount, 0);

  const hasData = cashRecords.length > 0 || purchaseRecords.length > 0 || pettyCashRecords.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-5">
          <p className="text-sm text-muted-foreground">總營收</p>
          <p className="text-2xl font-bold text-primary mt-1">${totalRevenue.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-sm text-muted-foreground">總進貨成本</p>
          <p className="text-2xl font-bold text-accent mt-1">${totalPurchases.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-sm text-muted-foreground">零用金支出</p>
          <p className="text-2xl font-bold text-destructive mt-1">${totalPettyCash.toLocaleString()}</p>
        </CardContent></Card>
      </div>

      {!hasData ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <p className="text-lg font-medium">尚無資料</p>
          <p className="text-sm mt-1">請先在各模組中新增資料，報表將自動生成</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {monthlyRevenue.length > 0 && (
            <Card><CardHeader><CardTitle className="text-base">每月營收趨勢</CardTitle></CardHeader>
              <CardContent><div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(35,15%,88%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="revenue" name="營收" fill="hsl(25,60%,42%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div></CardContent></Card>
          )}
          {monthlyPurchases.length > 0 && (
            <Card><CardHeader><CardTitle className="text-base">每月進貨成本</CardTitle></CardHeader>
              <CardContent><div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyPurchases}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(35,15%,88%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" name="進貨金額" stroke="hsl(160,30%,40%)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div></CardContent></Card>
          )}
          {expenseByCategory.length > 0 && (
            <Card><CardHeader><CardTitle className="text-base">零用金支出分類</CardTitle></CardHeader>
              <CardContent><div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                      dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {expenseByCategory.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div></CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}
