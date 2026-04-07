export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

export interface CashRegisterRecord {
  id: string;
  date: string;
  bills1000: number;
  bills500: number;
  bills100: number;
  coins50: number;
  coins10: number;
  coins5: number;
  coins1: number;
  other: number;
  cashTotal: number;
  storeCashRevenue: number;
  onlinePayment: number;
  totalRevenue: number;
  actualReceived: number;
  originalReserve: number;
  profitLoss: number;
  checker: string;
  notes: string;
}

export interface PurchaseRecord {
  id: string;
  date: string;
  supplier: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: string;
  checker: string;
  notes: string;
  extra1Name: string;
  extra1Value: string;
  extra2Name: string;
  extra2Value: string;
}

export interface PettyCashRecord {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  handler: string;
  notes: string;
  extra1Name: string;
  extra1Value: string;
  extra2Name: string;
  extra2Value: string;
}

export interface ReserveFundRecord {
  id: string;
  date: string;
  description: string;
  type: 'in' | 'out';
  amount: number;
  balance: number;
  handler: string;
  notes: string;
  extra1Name: string;
  extra1Value: string;
  extra2Name: string;
  extra2Value: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  safetyStock: number;
  currentStock: number;
}

export interface DailyInventoryRecord {
  id: string;
  date: string;
  items: { itemId: string; itemName: string; unit: string; quantity: number }[];
  checker: string;
  notes: string;
  extra1Name: string;
  extra1Value: string;
  extra2Name: string;
  extra2Value: string;
}

export interface NoodleDeliveryRecord {
  id: string;
  date: string;
  itemName: string;
  quantity: number;
  unit: string;
  receiver: string;
  notes: string;
  extra1Name: string;
  extra1Value: string;
  extra2Name: string;
  extra2Value: string;
}

export type ModuleKey = 
  | 'cash-register'
  | 'purchases'
  | 'petty-cash'
  | 'reserve-fund'
  | 'daily-food-inventory'
  | 'daily-warehouse-inventory'
  | 'product-inventory'
  | 'noodle-delivery'
  | 'master-database';
