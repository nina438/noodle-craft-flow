import { useState, useMemo, useRef } from 'react';
import { getDefaultInventory, saveInventory, CATEGORIES } from '@/lib/inventoryData';
import { exportToCSV, parseCSVFile } from '@/lib/exportUtils';
import { genId } from '@/lib/store';
import type { InventoryItem } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, AlertTriangle, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function MasterDatabasePage() {
  const [items, setItems] = useState<InventoryItem[]>(() => getDefaultInventory());
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: CATEGORIES[0] as string, unit: '', safetyStock: 0, currentStock: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let f = items;
    if (catFilter !== 'all') f = f.filter(i => i.category === catFilter);
    if (search) f = f.filter(i => i.name.includes(search));
    return f;
  }, [items, search, catFilter]);

  function addItem() {
    const item: InventoryItem = { id: genId(), ...newItem };
    const next = [...items, item];
    setItems(next); saveInventory(next); setOpen(false);
    setNewItem({ name: '', category: CATEGORIES[0], unit: '', safetyStock: 0, currentStock: 0 });
  }

  function updateStock(id: string, stock: number) {
    const next = items.map(i => i.id === id ? { ...i, currentStock: stock } : i);
    setItems(next); saveInventory(next);
  }

  function handleExport() {
    exportToCSV(
      ['品項名稱', '分類', '單位', '安全庫存', '目前庫存', '狀態'],
      filtered.map(i => [i.name, i.category, i.unit, i.safetyStock, i.currentStock, i.safetyStock > 0 && i.currentStock < i.safetyStock ? '不足' : '正常']),
      `總庫存表_${new Date().toISOString().slice(0, 10)}`
    );
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseCSVFile(file);
      if (rows.length < 2) { toast.error('檔案內容不足'); return; }
      const header = rows[0];
      const nameIdx = header.findIndex(h => h.includes('品項') || h.includes('名稱') || h.includes('name'));
      const catIdx = header.findIndex(h => h.includes('分類') || h.includes('category'));
      const unitIdx = header.findIndex(h => h.includes('單位') || h.includes('unit'));
      const safeIdx = header.findIndex(h => h.includes('安全') || h.includes('safety'));
      const stockIdx = header.findIndex(h => h.includes('庫存') || h.includes('stock'));

      if (nameIdx < 0) { toast.error('找不到品項名稱欄位'); return; }

      let added = 0, updated = 0;
      const next = [...items];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const name = row[nameIdx]?.trim();
        if (!name) continue;
        const existing = next.find(it => it.name === name);
        if (existing) {
          if (stockIdx >= 0 && row[stockIdx]) existing.currentStock = Number(row[stockIdx]) || 0;
          if (safeIdx >= 0 && row[safeIdx]) existing.safetyStock = Number(row[safeIdx]) || 0;
          updated++;
        } else {
          next.push({
            id: genId(),
            name,
            category: (catIdx >= 0 ? row[catIdx]?.trim() : '') || '其他',
            unit: (unitIdx >= 0 ? row[unitIdx]?.trim() : '') || '個',
            safetyStock: safeIdx >= 0 ? Number(row[safeIdx]) || 0 : 0,
            currentStock: stockIdx >= 0 ? Number(row[stockIdx]) || 0 : 0,
          });
          added++;
        }
      }
      setItems(next); saveInventory(next);
      toast.success(`匯入完成：新增 ${added} 項，更新 ${updated} 項`);
    } catch (err) {
      toast.error('匯入失敗：' + (err instanceof Error ? err.message : '未知錯誤'));
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  const lowStockCount = items.filter(i => i.safetyStock > 0 && i.currentStock < i.safetyStock).length;

  return (
    <div className="space-y-4 print-area">
      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <span className="text-sm text-warning font-medium">有 {lowStockCount} 項商品低於安全庫存</span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 no-print">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋品項..." className="h-9 max-w-48" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">全部分類</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" />匯出CSV</Button>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4 mr-1" />匯入CSV</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="erp-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-1" />新增品項</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>新增商品</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">品名</label>
                <Input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} className="h-9" /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">分類</label>
                <select value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">單位</label>
                  <Input value={newItem.unit} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))} className="h-9" /></div>
                <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">安全庫存</label>
                  <Input type="number" value={newItem.safetyStock} onChange={e => setNewItem(p => ({ ...p, safetyStock: Number(e.target.value) }))} className="h-9" /></div>
                <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">目前庫存</label>
                  <Input type="number" value={newItem.currentStock} onChange={e => setNewItem(p => ({ ...p, currentStock: Number(e.target.value) }))} className="h-9" /></div>
              </div>
              <Button onClick={addItem} className="w-full erp-gradient text-primary-foreground">新增</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="text-sm text-muted-foreground">顯示 {filtered.length} / {items.length} 項</div>
      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-8">#</TableHead><TableHead>品項名稱</TableHead><TableHead>分類</TableHead>
            <TableHead>單位</TableHead><TableHead className="text-right">安全庫存</TableHead>
            <TableHead className="text-right w-28">目前庫存</TableHead><TableHead>狀態</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((item, idx) => {
              const isLow = item.safetyStock > 0 && item.currentStock < item.safetyStock;
              return (
                <TableRow key={item.id} className={isLow ? 'bg-destructive/5' : ''}>
                  <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell><span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">{item.category}</span></TableCell>
                  <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                  <TableCell className="text-right">{item.safetyStock}</TableCell>
                  <TableCell className="text-right">
                    <Input type="number" value={item.currentStock}
                      onChange={e => updateStock(item.id, Number(e.target.value))}
                      className="h-7 w-20 text-sm text-right ml-auto" />
                  </TableCell>
                  <TableCell>
                    {isLow ? <span className="text-xs text-destructive font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" />不足</span>
                    : <span className="text-xs text-success">正常</span>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
