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

export interface PurchaseExtraRow {
  category: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
}

export interface PurchaseRecord {
  id: string;
  date: string;
  category: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: string;
  checker: string;
  notes: string;
  extraRows: PurchaseExtraRow[];
}

export interface PettyCashExtraRow {
  description: string;
  type: 'income' | 'expense';
  amount: number;
}

export interface PettyCashRecord {
  id: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
  handler: string;
  notes: string;
  extraRows: PettyCashExtraRow[];
}

export interface ReserveDenomination {
  denomination: number;
  quantity: number;
  amount: number;
}

export interface ReserveFundRecord {
  id: string;
  date: string;
  denominations: ReserveDenomination[];
  handler: string;
  notes: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  safetyStock: number;
  currentStock: number;
}

export interface InventoryCheckItem {
  itemName: string;
  unit: string;
  previousStock: number;
  inOut: 'in' | 'out' | 'none';
  quantity: number;
  currentStock: number;
}

export interface InventoryExtraRow {
  itemName: string;
  unit: string;
  inOut: 'in' | 'out' | 'none';
  quantity: number;
  previousStock: number;
  currentStock: number;
}

export interface DailyInventoryRecord {
  id: string;
  date: string;
  items: InventoryCheckItem[];
  checker: string;
  notes: string;
  extraRows: InventoryExtraRow[];
}

export interface NoodleExtraRow {
  itemName: string;
  quantity: number;
}

export interface NoodleDeliveryRecord {
  id: string;
  date: string;
  itemName: string;
  quantity: number;
  unit: string;
  receiver: string;
  notes: string;
  extraRows: NoodleExtraRow[];
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
