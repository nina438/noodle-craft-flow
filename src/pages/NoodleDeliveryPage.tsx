import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { getStore, setStore, genId } from '@/lib/store';
import { getDefaultInventory, saveInventory } from '@/lib/inventoryData';
import type { NoodleDeliveryRecord, NoodleExtraRow } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Search, Trash2 } from 'lucide-react';
import ExcelImportExport from '@/components/ExcelImportExport';
import { toast } from 'sonner';

const emptyExtra = (): NoodleExtraRow => ({ itemName: '', quantity: 0 });

function syncStockFromDelivery(itemName: string, qty: number) {
  if (!itemName || qty <= 0) return;
  const items = getDefaultInventory();
  const item = items.find(i => i.name === itemName);
  if (item) {
    item.currentStock += qty;
    saveInventory(items);
  }
}

export default function NoodleDeliveryPage() {
  const { staffList } = useAuth();
  const noodleItems = useMemo(() => getDefaultInventory().filter(i => i.category === '麵廠叫貨原料'), []);
  const [records, setRecords] = useState<NoodleDeliveryRecord[]>(() => getStore('noodle_delivery'));
  const [editing, setEditing] = useState<Omit<NoodleDeliveryRecord, 'id'> & { id?: string }>({
    date: new Date().toISOString().slice(0, 10), itemName: '', quantity: 0, unit: '包',
    receiver: '', notes: '', extraRows: Array.from({ length: 8 }, emptyExtra),
  });
  const [open, setOpen] = useState(false);
  const [searchDate, setSearchDate] = useState('');

  const filtered = useMemo(() => searchDate ? records.filter(r => r.date === searchDate) : records, [records, searchDate]);

  const INIT = () => ({
    date: new Date().toISOString().slice(0, 10), itemName: '', quantity: 0, unit: '包',
    receiver: '', notes: '', extraRows: Array.from({ length: 8 }, emptyExtra),
  });

  function save() {
    const isNew = !editing.id;
    let next: NoodleDeliveryRecord[];
    if (editing.id) next = records.map(r => r.id === editing.id ? editing as NoodleDeliveryRecord : r);
    else next = [...records, { ...editing, id: genId() } as NoodleDeliveryRecord];
    setRecords(next); setStore('noodle_delivery', next); setOpen(false); setEditing(INIT());
    if (isNew) {
      syncStockFromDelivery(editing.itemName, editing.quantity);
      (editing.extraRows || []).forEach(er => syncStockFromDelivery(er.itemName, er.quantity));
    }
  }

  function updateExtra(idx: number, field: keyof NoodleExtraRow, value: string | number) {
    setEditing(p => {
      const rows = [...(p.extraRows || [])];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...p, extraRows: rows };
    });
  }

  function handleImport(rows: string[][]) {
    const header = rows[0];
    const map = (kw: string[]) => header.findIndex(h => kw.some(k => h.includes(k)));
    const dateIdx = map(['日期']);
    const nameIdx = map(['商品名稱', '品項', '名稱']);
    const qtyIdx = map(['數量']);
    const unitIdx = map(['單位']);
    const recvIdx = map(['盤點人員', '收貨', '人員']);
    const notesIdx = map(['備註']);
    let added = 0;
    const next = [...records];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const dateVal = r[dateIdx >= 0 ? dateIdx : 0]?.trim();
      if (!dateVal) continue;
      let dateStr = dateVal;
      if (/^\d{5}$/.test(dateVal)) {
        const d = new Date((Number(dateVal) - 25569) * 86400000);
        dateStr = d.toISOString().slice(0, 10);
      } else if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(dateVal)) {
        dateStr = dateVal.replace(/\//g, '-').slice(0, 10);
      }
      const qty = Number(r[qtyIdx] || 0);
      const itemName = r[nameIdx] || '';
      next.push({
        id: genId(), date: dateStr, itemName,
        quantity: qty, unit: r[unitIdx] || '包', receiver: r[recvIdx] || '', notes: r[notesIdx] || '',
        extraRows: [],
      });
      syncStockFromDelivery(itemName, qty);
      added++;
    }
    setRecords(next); setStore('noodle_delivery', next);
    toast.success(`匯入完成：新增 ${added} 筆`);
  }

  return (
    <div className="space-y-4 print-area">
      <div className="flex flex-wrap items-center gap-3 no-print">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} className="h-9 max-w-48" />
          {searchDate && <Button variant="ghost" size="sm" onClick={() => setSearchDate('')}>清除</Button>}
        </div>
        <ExcelImportExport
          exportHeaders={['日期', '品項', '數量', '單位', '收貨人', '備註']}
          exportRows={() => filtered.map(r => [r.date, r.itemName, r.quantity, r.unit, r.receiver, r.notes])}
          exportFilename={`麵廠送貨_${new Date().toISOString().slice(0, 10)}`}
          onImport={handleImport}
        />
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setEditing(INIT()); }}>
          <DialogTrigger asChild><Button size="sm" className="erp-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-1" />新增</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing.id ? '編輯' : '新增'}送貨紀錄</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">日期</label>
                <Input type="date" value={editing.date} onChange={e => setEditing(p => ({ ...p, date: e.target.value }))} className="h-9" /></div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">品項</label>
                <select value={editing.itemName} onChange={e => {
                  const item = noodleItems.find(i => i.name === e.target.value);
                  setEditing(p => ({ ...p, itemName: e.target.value, unit: item?.unit || p.unit }));
                }} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">選擇品項</option>
                  {noodleItems.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">數量</label>
                  <Input type="number" value={editing.quantity} onChange={e => setEditing(p => ({ ...p, quantity: Number(e.target.value) }))} className="h-9" /></div>
                <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">單位</label>
                  <Input value={editing.unit} onChange={e => setEditing(p => ({ ...p, unit: e.target.value }))} className="h-9" /></div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">收貨人</label>
                <select value={editing.receiver} onChange={e => setEditing(p => ({ ...p, receiver: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">選擇</option>
                  {staffList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">備註</label>
                <Input value={editing.notes} onChange={e => setEditing(p => ({ ...p, notes: e.target.value }))} className="h-9" /></div>
              <p className="text-sm font-medium text-foreground mt-2">其他品項</p>
              {(editing.extraRows || []).map((row, idx) => (
                <div key={idx} className="p-3 border rounded-lg space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">其他欄位 {idx + 1}</span>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={row.itemName} onChange={e => updateExtra(idx, 'itemName', e.target.value)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                      <option value="">品項</option>
                      {noodleItems.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
                    </select>
                    <Input type="number" placeholder="數量" value={row.quantity || ''} onChange={e => updateExtra(idx, 'quantity', Number(e.target.value))} className="h-8 text-xs" />
                  </div>
                </div>
              ))}
              <Button onClick={save} className="w-full erp-gradient text-primary-foreground">儲存</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>日期</TableHead><TableHead>品項</TableHead>
            <TableHead className="text-right">數量</TableHead><TableHead>單位</TableHead>
            <TableHead>收貨人</TableHead><TableHead>備註</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">尚無資料</TableCell></TableRow>
            : filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.date}</TableCell><TableCell>{r.itemName}</TableCell>
                <TableCell className="text-right">{r.quantity}</TableCell><TableCell>{r.unit}</TableCell>
                <TableCell>{r.receiver}</TableCell><TableCell className="text-muted-foreground text-xs">{r.notes}</TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing({ ...r, extraRows: r.extraRows || Array.from({ length: 8 }, emptyExtra) }); setOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => { if (confirm('確定刪除此筆資料？')) { const next = records.filter(x => x.id !== r.id); setRecords(next); setStore('noodle_delivery', next); } }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
