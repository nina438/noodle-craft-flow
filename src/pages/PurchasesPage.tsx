import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { getStore, setStore, genId } from '@/lib/store';
import { exportToCSV } from '@/lib/exportUtils';
import { CATEGORIES, getItemsByCategory, PAYMENT_METHODS } from '@/lib/inventoryData';
import type { PurchaseRecord, PurchaseExtraRow } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Search, Download, Trash2 } from 'lucide-react';

const emptyExtra = (): PurchaseExtraRow => ({ category: '', itemName: '', quantity: 0, unit: '', unitPrice: 0, totalAmount: 0 });

const INIT: Omit<PurchaseRecord, 'id'> = {
  date: new Date().toISOString().slice(0, 10), category: '', itemName: '',
  quantity: 0, unit: '', unitPrice: 0, totalAmount: 0,
  paymentMethod: '現金', checker: '', notes: '',
  extraRows: Array.from({ length: 7 }, emptyExtra),
};

export default function PurchasesPage() {
  const { staffList } = useAuth();
  const [records, setRecords] = useState<PurchaseRecord[]>(() => getStore('purchases'));
  const [editing, setEditing] = useState<Omit<PurchaseRecord, 'id'> & { id?: string }>({ ...INIT, extraRows: INIT.extraRows.map(r => ({ ...r })) });
  const [open, setOpen] = useState(false);
  const [searchDate, setSearchDate] = useState('');

  const filtered = useMemo(() => searchDate ? records.filter(r => r.date === searchDate) : records, [records, searchDate]);
  const totalSum = useMemo(() => filtered.reduce((s, r) => {
    const mainTotal = r.quantity * r.unitPrice;
    const extraTotal = (r.extraRows || []).reduce((es, er) => es + er.quantity * er.unitPrice, 0);
    return s + mainTotal + extraTotal;
  }, 0), [filtered]);

  const mainItems = useMemo(() => editing.category ? getItemsByCategory(editing.category) : [], [editing.category]);

  function save() {
    const totalAmount = editing.quantity * editing.unitPrice;
    const extraRows = editing.extraRows.map(er => ({ ...er, totalAmount: er.quantity * er.unitPrice }));
    const rec = { ...editing, totalAmount, extraRows };
    let next: PurchaseRecord[];
    if (rec.id) next = records.map(r => r.id === rec.id ? rec as PurchaseRecord : r);
    else next = [...records, { ...rec, id: genId() } as PurchaseRecord];
    setRecords(next); setStore('purchases', next); setOpen(false);
    setEditing({ ...INIT, extraRows: INIT.extraRows.map(r => ({ ...r })) });
  }

  function updateExtra(idx: number, field: keyof PurchaseExtraRow, value: string | number) {
    setEditing(p => {
      const rows = [...p.extraRows];
      rows[idx] = { ...rows[idx], [field]: value };
      if (field === 'category') rows[idx].itemName = '';
      return { ...p, extraRows: rows };
    });
  }

  function handleExport() {
    exportToCSV(
      ['日期', '種類', '品項', '數量', '單位', '單價', '總額', '付款方式', '經手人', '備註'],
      filtered.map(r => [r.date, r.category, r.itemName, r.quantity, r.unit, r.unitPrice, r.totalAmount, r.paymentMethod, r.checker, r.notes]),
      `進貨紀錄_${new Date().toISOString().slice(0, 10)}`
    );
  }

  return (
    <div className="space-y-4 print-area">
      <div className="flex flex-wrap items-center gap-3 no-print">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} className="h-9 max-w-48" />
          {searchDate && <Button variant="ghost" size="sm" onClick={() => setSearchDate('')}>清除</Button>}
        </div>
        <div className="text-sm font-medium text-foreground">總計：<span className="text-primary">${totalSum.toLocaleString()}</span></div>
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" />匯出CSV</Button>
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setEditing({ ...INIT, extraRows: INIT.extraRows.map(r => ({ ...r })) }); }}>
          <DialogTrigger asChild><Button size="sm" className="erp-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-1" />新增</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing.id ? '編輯' : '新增'}進貨紀錄</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">日期</label>
                  <Input type="date" value={editing.date} onChange={e => setEditing(p => ({ ...p, date: e.target.value }))} className="h-9" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">付款方式</label>
                  <select value={editing.paymentMethod} onChange={e => setEditing(p => ({ ...p, paymentMethod: e.target.value }))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <p className="text-sm font-medium text-foreground">主要品項</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">種類</label>
                  <select value={editing.category} onChange={e => setEditing(p => ({ ...p, category: e.target.value, itemName: '' }))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">選擇種類</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">商品名稱</label>
                  <select value={editing.itemName} onChange={e => setEditing(p => ({ ...p, itemName: e.target.value }))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">選擇商品</option>
                    {mainItems.map(i => <option key={i.name} value={i.name}>{i.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">數量</label>
                  <Input type="number" value={editing.quantity} onChange={e => setEditing(p => ({ ...p, quantity: Number(e.target.value) }))} className="h-9" /></div>
                <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">單位</label>
                  <Input value={editing.unit} onChange={e => setEditing(p => ({ ...p, unit: e.target.value }))} className="h-9" /></div>
                <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">單價</label>
                  <Input type="number" value={editing.unitPrice} onChange={e => setEditing(p => ({ ...p, unitPrice: Number(e.target.value) }))} className="h-9" /></div>
                <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">金額</label>
                  <div className="h-9 flex items-center px-3 rounded-md bg-muted text-sm font-medium">${(editing.quantity * editing.unitPrice).toLocaleString()}</div></div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">盤點人員</label>
                <select value={editing.checker} onChange={e => setEditing(p => ({ ...p, checker: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">選擇人員</option>
                  {staffList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">備註</label>
                <Input value={editing.notes} onChange={e => setEditing(p => ({ ...p, notes: e.target.value }))} className="h-9" /></div>

              <p className="text-sm font-medium text-foreground mt-2">其他品項</p>
              {editing.extraRows.map((row, idx) => {
                const extraItems = row.category ? getItemsByCategory(row.category) : [];
                return (
                  <div key={idx} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">其他欄位 {idx + 1}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select value={row.category} onChange={e => updateExtra(idx, 'category', e.target.value)}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                        <option value="">種類</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select value={row.itemName} onChange={e => updateExtra(idx, 'itemName', e.target.value)}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                        <option value="">商品名稱</option>
                        {extraItems.map(i => <option key={i.name} value={i.name}>{i.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <Input type="number" placeholder="數量" value={row.quantity || ''} onChange={e => updateExtra(idx, 'quantity', Number(e.target.value))} className="h-8 text-xs" />
                      <Input placeholder="單位" value={row.unit} onChange={e => updateExtra(idx, 'unit', e.target.value)} className="h-8 text-xs" />
                      <Input type="number" placeholder="單價" value={row.unitPrice || ''} onChange={e => updateExtra(idx, 'unitPrice', Number(e.target.value))} className="h-8 text-xs" />
                      <div className="h-8 flex items-center px-2 rounded-md bg-muted text-xs">${(row.quantity * row.unitPrice).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}

              <Button onClick={save} className="w-full erp-gradient text-primary-foreground">儲存</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>日期</TableHead><TableHead>種類</TableHead><TableHead>品項</TableHead>
            <TableHead className="text-right">數量</TableHead><TableHead>單位</TableHead>
            <TableHead className="text-right">單價</TableHead><TableHead className="text-right">總額</TableHead>
            <TableHead>經手人</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">尚無資料</TableCell></TableRow>
            : filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.date}</TableCell>
                <TableCell>{r.category}</TableCell><TableCell>{r.itemName}</TableCell>
                <TableCell className="text-right">{r.quantity}</TableCell><TableCell>{r.unit}</TableCell>
                <TableCell className="text-right">{r.unitPrice.toLocaleString()}</TableCell>
                <TableCell className="text-right font-medium">{r.totalAmount.toLocaleString()}</TableCell>
                <TableCell>{r.checker}</TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing({ ...r, extraRows: r.extraRows || Array.from({ length: 7 }, emptyExtra) }); setOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => { if (confirm('確定刪除此筆資料？')) { const next = records.filter(x => x.id !== r.id); setRecords(next); setStore('purchases', next); } }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
