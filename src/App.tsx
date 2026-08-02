import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import AppLayout from "./components/AppLayout";
import CashRegisterPage from "./pages/CashRegisterPage";
import PurchasesPage from "./pages/PurchasesPage";
import PettyCashPage from "./pages/PettyCashPage";
import ReserveFundPage from "./pages/ReserveFundPage";
import InventoryCheckPage from "./pages/InventoryCheckPage";
import NoodleDeliveryPage from "./pages/NoodleDeliveryPage";
import MasterDatabasePage from "./pages/MasterDatabasePage";
import MonthlyReportPage from "./pages/MonthlyReportPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthGate() {
  const { user } = useAuth();
  if (!user) return <LoginPage />;
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cash-register" element={<CashRegisterPage />} />
        <Route path="/purchases" element={<PurchasesPage />} />
        <Route path="/petty-cash" element={<PettyCashPage />} />
        <Route path="/reserve-fund" element={<ReserveFundPage />} />
        <Route path="/daily-food" element={<InventoryCheckPage storeKey="daily_food" categoryFilter={['生鮮食材', '乾貨調味品']} title="食材盤點" showInOut />} />
        <Route path="/daily-warehouse" element={<InventoryCheckPage storeKey="daily_warehouse" categoryFilter={['倉庫備品']} title="倉庫備品盤點" showInOut />} />
        <Route path="/product-inventory" element={<InventoryCheckPage storeKey="product_inventory" categoryFilter={['販售商品']} title="販售商品盤點" showInOut />} />
        <Route path="/noodle-delivery" element={<NoodleDeliveryPage />} />
        <Route path="/master-database" element={<MasterDatabasePage />} />
        <Route path="/monthly-report" element={<MonthlyReportPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <HashRouter>
          <AuthGate />
        </HashRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
