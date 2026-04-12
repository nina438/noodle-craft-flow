import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { getStore, setStore, genId } from '@/lib/store';
import { getDefaultInventory, saveInventory, CATEGORIES, getItemsByCategory } from '@/lib/inventoryData';
import type { InventoryItem, DailyInventoryRecord, InventoryCheckItem, InventoryExtraRow } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Save, Trash2 } from 'lucide-react';
import ExcelImportExport from '@/components/ExcelImportExport';
import { toast } from 'sonner';

interface Props {
  storeKey: string;
  categoryFilter: string[];
  title: string;
  showInOut?: boolean;
}

const emptyExtraRow = (): InventoryExtraRow => ({ itemName: '', unit: '', inOut: 'none', quantity: 0, previousStock: 0, currentStock: 0 });

export default function InventoryCheckPage({ storeKey, categoryFilter, title, showInOut = false }: Props) {
  const { staffList } = useAuth();
  const inventory = useMemo(() => getDefaultInventory().filter(i => categoryFilter.includes(i.category)), []);
  const [records, setRecords] = useState<DailyInventoryRecord[]>(() => getStore(storeKey));
  const [searchDate, setSearchDate] = useState('');
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [checker, setChecker] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InventoryCheckItem[]>([]);
  const [extraRows, setExtraRows] = useState<InventoryExtraRow[]>(Array.from({ length: 5 }, emptyExtraRow));
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => searchDate ? records.filter(r => r.date === searchDate) : records, [records, searchDate]);

  function getLastStock(itemName: string): number {
    for (let i = records.length - 1; i >= 0; i--) {
      const found = records[i].items.find(it => it.itemName === itemName);
      if (found) return found.currentStock;
    }
    const inv = inventory.find(i => i.name === itemName);
    return inv ? inv.currentStock : 0;
  }

  function startNew() {
    setEditingId(null);
    setDate(new Date().toISOString().slice(0, 10));
    setChecker(''); setNotes('');
    setItems(inventory.map(i => {
      const prev = getLastStock(i.name);
      return { itemName: i.name, unit: i.unit, previousStock: prev, inOut: 'none' as const, quantity: 0, currentStock: prev };
    }));
    setExtraRows(Array.from({ length: 5 }, emptyExtraRow));
    setOpen(true);
  }

  function startEdit(r: DailyInventoryRecord) {
    setEditingId(r.id);
    setDate(r.date); setChecker(r.checker); setNotes(r.notes);
    setItems(r.items.map(i => ({ ...i })));
    setExtraRows(r.extraRows ? r.extraRows.map(e => ({ ...e })) : Array.from({ length: 5 }, emptyExtraRow));
    setOpen(true);
  }

  function updateItem(idx: number, field: string, value: string | number) {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[idx], [field]: value };
      if (field === 'inOut' || field === 'quantity') {
        const qty = field === 'quantity' ? Number(value) : item.quantity;
        const io = field === 'inOut' ? value as string : item.inOut;
        if (io === 'in') item.currentStock = item.previousStock + qty;
        else if (io === 'out') item.currentStock = item.previousStock - qty;
        else item.currentStock = item.previousStock;
      }
      next[idx] = item;
      return next;
    });
  }

  function updateExtraRow(idx: number, field: keyof InventoryExtraRow, value: string | number) {
    setExtraRows(prev => {
      const next = [...prev];
      const row = { ...next[idx], [field]: value };
      if (field === 'inOut' || field === 'quantity') {
        if (row.inOut === 'in') row.currentStock = row.previousStock + row.quantity;
        else if (row.inOut === 'out') row.currentStock = row.previousStock - row.quantity;
        else row.currentStock = row.previousStock;
      }
      if (field === 'itemName') {
        const inv = inventory.find(i => i.name === value);
        if (inv) {
          row.unit = inv.unit;
          row.previousStock = getLastStock(inv.name);
          row.currentStock = row.previousStock;
        }
      }
      next[idx] = row;
      return next;
    });
  }

  function save() {
    const rec: DailyInventoryRecord = { id: editingId || genId(), date, items, checker, notes, extraRows };
    let next: DailyInventoryRecord[];
    if (editingId) next = records.map(r => r.id === editingId ? rec : r);
    else next = [...records, rec];
    setRecords(next); setStore(storeKey, next); setOpen(false);
    // Sync stock to master database
    const allInv = getDefaultInventory();
    let changed = false;
    items.forEach(it => {
      if (showInOut && it.currentStock !== undefined) {
        const master = allInv.find(m => m.name === it.itemName);
        if (master && master.currentStock !== it.currentStock) {
          master.currentStock = it.currentStock;
          changed = true;
        }
      }
    });
    extraRows.forEach(er => {
      if (showInOut && er.itemName && er.currentStock !== undefined) {
        const master = allInv.find(m => m.name === er.itemName);
        if (master && master.currentStock !== er.currentStock) {
          master.currentStock = er.currentStock;
          changed = true;
        }
      }
    });
    if (changed) saveInventory(allInv);
  }

  function handleImport(rows: string[][]) {
    const header = rows[0];
    const map = (kw: string[]) => header.findIndex(h => kw.some(k => h.includes(k)));
    const nameIdx = map(['品項', '名稱']); const qtyIdx = map(['數量']);
    const inOutIdx = map(['進出', '進/出']);
    if (nameIdx < 0) { toast.error('找不到品項欄位'); return; }
    // Build a record from the imported data
    const importItems = inventory.map(i => {
      const prev = getLastStock(i.name);
      return { itemName: i.name, unit: i.unit, previousStock: prev, inOut: 'none' as const, quantity: 0, currentStock: prev };
    });
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const name = r[nameIdx]?.trim();
      if (!name) continue;
      const found = importItems.find(it => it.itemName === name);
      if (found) {
        found.quantity = Number(r[qtyIdx] || 0);
        if (inOutIdx >= 0) {
          const io = r[inOutIdx]?.trim();
          (found as any).inOut = io === '進' ? 'in' : io === '出' ? 'out' : 'none';
        }
        const inOut = (found as any).inOut as string;
        if (inOut === 'in') found.currentStock = found.previousStock + found.quantity;
        else if (inOut === 'out') found.currentStock = found.previousStock - found.quantity;
      }
    }
    const rec: DailyInventoryRecord = {
      id: genId(), date: new Date().toISOString().slice(0, 10),
      items: importItems, checker: '', notes: '從Excel匯入', extraRows: [],
    };
    const next = [...records, rec];
    setRecords(next); setStore(storeKey, next);
    toast.success('盤點資料匯入完成');
  }

  const allItems = useMemo(() => {
    const result: { name: string; unit: string }[] = [];
    categoryFilter.forEach(cat => {
      getItemsByCategory(cat).forEach(i => result.push({ name: i.name, unit: i.unit }));
    });
    return result;
  }, [categoryFilter]);

  return (
    <div className="space-y-4 print-area">
      <div className="flex flex-wrap items-center gap-3 no-print">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} className="h-9 max-w-48" />
          {searchDate && <Button variant="ghost" size="sm" onClick={() => setSearchDate('')}>清除</Button>}
        </div>
        <ExcelImportExport
          exportHeaders={showInOut ? ['品項', '單位', '昨日庫存', '進出庫', '數量', '庫存結算'] : ['品項', '單位', '數量']}
          exportRows={() => {
            const latest = filtered.length > 0 ? filtered[filtered.length - 1] : null;
            if (!latest) return [];
            return latest.items.map(i => showInOut
              ? [i.itemName, i.unit, i.previousStock, i.inOut === 'in' ? '進' : i.inOut === 'out' ? '出' : '-', i.quantity, i.currentStock]
              : [i.itemName, i.unit, i.quantity]
            ) as (string | number)[][];
          }}
          exportFilename={`${title}_${new Date().toISOString().slice(0, 10)}`}
          onImport={handleImport}
        />
        <Button size="sm" className="erp-gradient text-primary-foreground" onClick={startNew}><Plus className="w-4 h-4 mr-1" />新增盤點</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? '編輯' : '新增'}{title}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">日期</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9" /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">盤點人員</label>
                <select value={checker} onChange={e => setChecker(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">選擇</option>
                  {staffList.map(s => <option key={s} value={s}>{s}</option>)}
                </select></div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="w-8">#</TableHead><TableHead>品項</TableHead><TableHead>單位</TableHead>
                  {showInOut && <><TableHead className="w-24">昨日庫存</TableHead><TableHead className="w-24">進出庫</TableHead></>}
                  <TableHead className="w-24">數量</TableHead>
                  {showInOut && <TableHead className="w-24">庫存結算</TableHead>}
                </TableRow></TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={item.itemName}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="text-sm font-medium">{item.itemName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.unit}</TableCell>
                      {showInOut && (
                        <>
                          <TableCell className="text-sm">{item.previousStock}</TableCell>
                          <TableCell>
                            <select value={item.inOut} onChange={e => updateItem(idx, 'inOut', e.target.value)}
                              className="h-7 w-full rounded border border-input bg-background px-1 text-xs">
                              <option value="none">-</option><option value="in">進</option><option value="out">出</option>
                            </select>
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <Input type="number" value={item.quantity || ''} placeholder="0"
                          onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} className="h-7 text-sm" />
                      </TableCell>
                      {showInOut && <TableCell className="text-sm font-medium">{item.currentStock}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <p className="text-sm font-medium text-foreground">其他品項</p>
            {extraRows.map((row, idx) => (
              <div key={idx} className="p-3 border rounded-lg space-y-2">
                <span className="text-xs font-medium text-muted-foreground">其他欄位 {idx + 1}</span>
                <div className="grid grid-cols-2 gap-2">
                  <select value={row.itemName} onChange={e => updateExtraRow(idx, 'itemName', e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                    <option value="">選擇品項</option>
                    {allItems.map(i => <option key={i.name} value={i.name}>{i.name}</option>)}
                  </select>
                  <Input placeholder="單位" value={row.unit} onChange={e => updateExtraRow(idx, 'unit', e.target.value)} className="h-8 text-xs" />
                </div>
                <div className={`grid ${showInOut ? 'grid-cols-4' : 'grid-cols-1'} gap-2`}>
                  {showInOut && (
                    <>
                      <div className="text-xs flex items-center">昨日: {row.previousStock}</div>
                      <select value={row.inOut} onChange={e => updateExtraRow(idx, 'inOut', e.target.value)}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                        <option value="none">-</option><option value="in">進</option><option value="out">出</option>
                      </select>
                    </>
                  )}
                  <Input type="number" placeholder="數量" value={row.quantity || ''} onChange={e => updateExtraRow(idx, 'quantity', Number(e.target.value))} className="h-8 text-xs" />
                  {showInOut && <div className="text-xs flex items-center">結算: {row.currentStock}</div>}
                </div>
              </div>
            ))}

            <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">備註</label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} className="h-9" /></div>
            <Button onClick={save} className="w-full erp-gradient text-primary-foreground"><Save className="w-4 h-4 mr-1" />儲存盤點</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>日期</TableHead><TableHead>盤點人員</TableHead><TableHead className="text-right">品項數</TableHead>
            <TableHead>備註</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">尚無資料</TableCell></TableRow>
            : filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.date}</TableCell>
                <TableCell>{r.checker}</TableCell>
                <TableCell className="text-right">{r.items.filter(i => i.quantity > 0).length}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{r.notes}</TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(r)}>查看/編輯</Button>
                  <Button variant="ghost" size="sm" onClick={() => { if (confirm('確定刪除此筆盤點紀錄？')) { const next = records.filter(x => x.id !== r.id); setRecords(next); setStore(storeKey, next); } }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
