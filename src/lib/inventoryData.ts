import type { InventoryItem } from './types';
import { genId } from './store';

interface RawItem { name: string; category: string; unit: string; safetyStock: number; currentStock: number; }

const rawFreshItems: RawItem[] = [
  { name: '豆干', category: '生鮮食材', unit: '1斤/包', safetyStock: 2, currentStock: 0 },
  { name: '海帶', category: '生鮮食材', unit: '1斤/包', safetyStock: 2, currentStock: 0 },
  { name: '大白菜(泡菜)', category: '生鮮食材', unit: '500克/盒', safetyStock: 5, currentStock: 0 },
  { name: '小黃瓜(醬瓜)', category: '生鮮食材', unit: '盒', safetyStock: 2, currentStock: 0 },
  { name: '蒜碎', category: '生鮮食材', unit: '斤', safetyStock: 0.2, currentStock: 0 },
  { name: '蔥', category: '生鮮食材', unit: '斤', safetyStock: 1, currentStock: 0 },
  { name: '小白菜', category: '生鮮食材', unit: '斤', safetyStock: 0.08, currentStock: 0 },
  { name: '大陸妹', category: '生鮮食材', unit: '斤', safetyStock: 2, currentStock: 0 },
  { name: '青江菜', category: '生鮮食材', unit: '斤', safetyStock: 1, currentStock: 0 },
  { name: '大辣椒', category: '生鮮食材', unit: '斤', safetyStock: 0.2, currentStock: 0 },
  { name: '薑', category: '生鮮食材', unit: '斤', safetyStock: 1, currentStock: 0 },
  { name: '蒜泥', category: '生鮮食材', unit: '盒', safetyStock: 1, currentStock: 0 },
  { name: '油豆腐', category: '生鮮食材', unit: '個', safetyStock: 5, currentStock: 0 },
  { name: '百頁', category: '生鮮食材', unit: '包', safetyStock: 3, currentStock: 0 },
  { name: '白豆干', category: '生鮮食材', unit: '包', safetyStock: 3, currentStock: 0 },
  { name: '溏心蛋', category: '生鮮食材', unit: '10顆/包', safetyStock: 12, currentStock: 0 },
  { name: '魚丸', category: '生鮮食材', unit: '包', safetyStock: 10, currentStock: 0 },
  { name: '貢丸', category: '生鮮食材', unit: '3公斤/包', safetyStock: 800, currentStock: 0 },
  { name: '玉子燒', category: '生鮮食材', unit: '條', safetyStock: 2, currentStock: 0 },
  { name: '黑豆', category: '生鮮食材', unit: '盒', safetyStock: 0.5, currentStock: 0 },
  { name: '毛豆', category: '生鮮食材', unit: '包', safetyStock: 1, currentStock: 0 },
  { name: '米血', category: '生鮮食材', unit: '包', safetyStock: 0.5, currentStock: 0 },
  { name: '舒肥雞', category: '生鮮食材', unit: '包', safetyStock: 3, currentStock: 0 },
  { name: '花枝漿', category: '生鮮食材', unit: '包', safetyStock: 1, currentStock: 0 },
  { name: '牛奶', category: '生鮮食材', unit: '罐', safetyStock: 1, currentStock: 0 },
  { name: '豬腱肉', category: '生鮮食材', unit: '600克/包', safetyStock: 4, currentStock: 0 },
  { name: '白油', category: '生鮮食材', unit: '斤', safetyStock: 2, currentStock: 0 },
  { name: '大骨', category: '生鮮食材', unit: '付', safetyStock: 2, currentStock: 0 },
  { name: '絞肉8斤', category: '生鮮食材', unit: '包', safetyStock: 0, currentStock: 0 },
  { name: '皮油4斤', category: '生鮮食材', unit: '包', safetyStock: 2, currentStock: 0 },
  { name: '雞蛋', category: '生鮮食材', unit: '箱', safetyStock: 0.5, currentStock: 0 },
  { name: '排骨', category: '生鮮食材', unit: '包', safetyStock: 0, currentStock: 0 },
];

const rawDryItems: RawItem[] = [
  { name: '原味醬油(12公斤桶)', category: '乾貨調味品', unit: '桶', safetyStock: 6, currentStock: 0 },
  { name: '薄鹽醬油', category: '乾貨調味品', unit: '瓶', safetyStock: 1, currentStock: 0 },
  { name: '原味醬油(1000ml)', category: '乾貨調味品', unit: '瓶', safetyStock: 2, currentStock: 0 },
  { name: '蠔油', category: '乾貨調味品', unit: '桶', safetyStock: 1, currentStock: 2 },
  { name: '二砂', category: '乾貨調味品', unit: '包', safetyStock: 5, currentStock: 17 },
  { name: '白醋', category: '乾貨調味品', unit: '桶', safetyStock: 1, currentStock: 0 },
  { name: '烏醋', category: '乾貨調味品', unit: '桶', safetyStock: 1, currentStock: 0 },
  { name: '米酒', category: '乾貨調味品', unit: '瓶', safetyStock: 1, currentStock: 5 },
  { name: '香油', category: '乾貨調味品', unit: '桶', safetyStock: 1, currentStock: 0 },
  { name: '豆腐乳', category: '乾貨調味品', unit: '罐', safetyStock: 0.5, currentStock: 1 },
  { name: '麻醬', category: '乾貨調味品', unit: '桶', safetyStock: 0.333, currentStock: 0 },
  { name: '冰糖', category: '乾貨調味品', unit: '包', safetyStock: 1, currentStock: 2 },
  { name: '金味王', category: '乾貨調味品', unit: '桶', safetyStock: 1, currentStock: 1 },
  { name: '蔭瓜', category: '乾貨調味品', unit: '個', safetyStock: 6, currentStock: 0 },
  { name: '味醂', category: '乾貨調味品', unit: '桶', safetyStock: 1, currentStock: 0 },
  { name: '紫菜', category: '乾貨調味品', unit: '包', safetyStock: 0.5, currentStock: 1 },
  { name: '黑胡椒粒', category: '乾貨調味品', unit: '包', safetyStock: 0.5, currentStock: 1 },
  { name: '胡椒鹽', category: '乾貨調味品', unit: '盒', safetyStock: 0.5, currentStock: 1 },
  { name: '海苔粉', category: '乾貨調味品', unit: '包', safetyStock: 0.2, currentStock: 0 },
  { name: '海鹽', category: '乾貨調味品', unit: '包', safetyStock: 0.333, currentStock: 0 },
  { name: '沙拉油', category: '乾貨調味品', unit: '桶', safetyStock: 0.5, currentStock: 0 },
];

const rawWarehouseItems: RawItem[] = [
  { name: '竹筷', category: '倉庫備品', unit: '包', safetyStock: 2, currentStock: 0 },
  { name: '外帶杯', category: '倉庫備品', unit: '條', safetyStock: 2, currentStock: 7 },
  { name: '蛋糕盒(小菜盒)', category: '倉庫備品', unit: '條', safetyStock: 3, currentStock: 22 },
  { name: '吸管', category: '倉庫備品', unit: '袋', safetyStock: 0.333, currentStock: 1.5 },
  { name: '一體大', category: '倉庫備品', unit: '條', safetyStock: 2, currentStock: 3 },
  { name: '燙青菜碗+蓋', category: '倉庫備品', unit: '條', safetyStock: 1, currentStock: 2 },
  { name: '湯碗(500cc)', category: '倉庫備品', unit: '條', safetyStock: 1, currentStock: 11.5 },
  { name: '半斤清袋', category: '倉庫備品', unit: '包', safetyStock: 1, currentStock: 11 },
  { name: '1斤清袋', category: '倉庫備品', unit: '包', safetyStock: 1, currentStock: 1 },
  { name: '3斤清袋', category: '倉庫備品', unit: '包', safetyStock: 1, currentStock: 2 },
  { name: '加購塑膠袋', category: '倉庫備品', unit: '包', safetyStock: 1, currentStock: 8 },
  { name: '抹布', category: '倉庫備品', unit: '條', safetyStock: 2, currentStock: 25 },
  { name: '酒精', category: '倉庫備品', unit: '瓶', safetyStock: 1, currentStock: 1 },
  { name: '客用衛生紙', category: '倉庫備品', unit: '包', safetyStock: 2, currentStock: 1 },
  { name: '自用衛生紙', category: '倉庫備品', unit: '包', safetyStock: 2, currentStock: 3 },
  { name: '沙拉脫', category: '倉庫備品', unit: '瓶', safetyStock: 0.5, currentStock: 4 },
  { name: '12號紙袋', category: '倉庫備品', unit: '個', safetyStock: 100, currentStock: 81 },
  { name: '4號紙袋', category: '倉庫備品', unit: '個', safetyStock: 100, currentStock: 0 },
  { name: '8號紙袋', category: '倉庫備品', unit: '個', safetyStock: 100, currentStock: 0 },
];

const rawSalesItems: RawItem[] = [
  { name: '陽光掛麵 - 細麵', category: '販售商品', unit: '包', safetyStock: 5, currentStock: 19 },
  { name: '陽光掛麵 - 中寬麵', category: '販售商品', unit: '包', safetyStock: 5, currentStock: 10 },
  { name: '陽光掛麵 - 大寬麵', category: '販售商品', unit: '包', safetyStock: 5, currentStock: 20 },
  { name: '陽光掛麵 - 長安麵', category: '販售商品', unit: '包', safetyStock: 5, currentStock: 20 },
  { name: '龍骨魚麵', category: '販售商品', unit: '包', safetyStock: 5, currentStock: 10 },
  { name: '可可麵', category: '販售商品', unit: '包', safetyStock: 3, currentStock: 10 },
  { name: '全麥麵', category: '販售商品', unit: '包', safetyStock: 3, currentStock: 0 },
  { name: '鐵觀音茶麵', category: '販售商品', unit: '包', safetyStock: 3, currentStock: 0 },
  { name: '陽光掛麵 - 綜合禮袋組', category: '販售商品', unit: '袋', safetyStock: 3, currentStock: 0 },
  { name: '金蔥醬 (五辛素)', category: '販售商品', unit: '盒', safetyStock: 3, currentStock: 10 },
  { name: '椒麻醬 (全素)', category: '販售商品', unit: '盒', safetyStock: 3, currentStock: 10 },
  { name: '陽光拌麵－4入拌麵組(雙醬)', category: '販售商品', unit: '盒', safetyStock: 2, currentStock: 10 },
  { name: '陽光拌麵－4入拌麵組(金蔥)', category: '販售商品', unit: '盒', safetyStock: 2, currentStock: 0 },
  { name: '陽光拌麵－4入拌麵組(椒麻)', category: '販售商品', unit: '盒', safetyStock: 2, currentStock: 0 },
  { name: '屏東風光水地方創生禮盒', category: '販售商品', unit: '盒', safetyStock: 1, currentStock: 2 },
  { name: '午仔魚酥', category: '販售商品', unit: '包', safetyStock: 5, currentStock: 5 },
  { name: '即食檸檬果乾', category: '販售商品', unit: '罐', safetyStock: 2, currentStock: 2 },
  { name: '爆薏仁焦糖爆米花', category: '販售商品', unit: '罐', safetyStock: 2, currentStock: 6 },
  { name: '屏農紅豆湯', category: '販售商品', unit: '罐', safetyStock: 2, currentStock: 4 },
  { name: '長庚纖花茶', category: '販售商品', unit: '瓶', safetyStock: 5, currentStock: 10 },
];

const rawNoodleFactoryItems: RawItem[] = [
  { name: '七味唐辛子', category: '麵廠叫貨原料', unit: '包', safetyStock: 0, currentStock: 0 },
  { name: '辣椒粉', category: '麵廠叫貨原料', unit: '包', safetyStock: 0, currentStock: 0 },
  { name: '老干媽', category: '麵廠叫貨原料', unit: '罐', safetyStock: 0, currentStock: 0 },
  { name: '鹽巴', category: '麵廠叫貨原料', unit: '包', safetyStock: 0, currentStock: 0 },
  { name: '花椒粒', category: '麵廠叫貨原料', unit: '包', safetyStock: 0, currentStock: 0 },
  { name: '八角', category: '麵廠叫貨原料', unit: '包', safetyStock: 0, currentStock: 0 },
  { name: '陽光掛麵 - 細麵 (批)', category: '麵廠叫貨原料', unit: '袋', safetyStock: 0, currentStock: 0 },
  { name: '陽光掛麵 - 中寬麵 (批)', category: '麵廠叫貨原料', unit: '袋', safetyStock: 0, currentStock: 0 },
  { name: '陽光掛麵 - 大寬麵(批)', category: '麵廠叫貨原料', unit: '袋', safetyStock: 0, currentStock: 0 },
  { name: '陽光掛麵 - 長安麵 (批)', category: '麵廠叫貨原料', unit: '袋', safetyStock: 0, currentStock: 0 },
  { name: '金蔥袋裝出餐用', category: '麵廠叫貨原料', unit: '袋', safetyStock: 0, currentStock: 0 },
  { name: '椒麻醬袋裝出餐用', category: '麵廠叫貨原料', unit: '袋', safetyStock: 0, currentStock: 0 },
];

export function getDefaultInventory(): InventoryItem[] {
  const stored = localStorage.getItem('erp_master_inventory');
  if (stored) return JSON.parse(stored);
  
  const all = [...rawFreshItems, ...rawDryItems, ...rawWarehouseItems, ...rawSalesItems, ...rawNoodleFactoryItems];
  const items: InventoryItem[] = all.map(r => ({
    id: genId(),
    name: r.name,
    category: r.category,
    unit: r.unit,
    safetyStock: r.safetyStock,
    currentStock: r.currentStock,
  }));
  localStorage.setItem('erp_master_inventory', JSON.stringify(items));
  return items;
}

export function saveInventory(items: InventoryItem[]) {
  localStorage.setItem('erp_master_inventory', JSON.stringify(items));
}

export const CATEGORIES = ['生鮮食材', '乾貨調味品', '倉庫備品', '販售商品', '麵廠叫貨原料'] as const;
