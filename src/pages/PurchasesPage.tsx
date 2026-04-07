import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { getStore, setStore, genId } from '@/lib/store';
import type { PurchaseRecord } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Search } from 'lucide-react';

const INIT: Omit<PurchaseRecord, 'id'> = {
  date: new Date().toISOString().slice(0, 10), supplier: '', itemName: '',
  quantity: 0, unit: '', unitPrice: 0, totalAmount: 0,
  paymentMethod: '現金', checker: '', notes: '',
  extra1Name: '', extra1Value: '', extra2Name: '', extra2Value: '',
};

export default function PurchasesPage() {
  const { staffList } = useAuth();
  const [records, setRecords] = useState<PurchaseRecord[]>(() => getStore('purchases'));
  const [editing, setEditing] = useState<Omit<PurchaseRecord, 'id'> & { id?: string }>(INIT);
  const [open, setOpen] = useState(false);
  const [searchDate, setSearchDate] = useState('');

  const filtered = useMemo(() => searchDate ? records.filter(r => r.date === searchDate) : records, [records, searchDate]);
  const totalSum = useMemo(() => filtered.reduce((s, r) => s + r.totalAmount, 0), [filtered]);

  function save() {
    const rec = { ...editing, totalAmount: editing.quantity * editing.unitPrice };
    let next: PurchaseRecord[];
    if (rec.id) next = records.map(r => r.id === rec.id ? rec as PurchaseRecord : r);
    else next = [...records, { ...rec, id: genId() } as PurchaseRecord];
    setRecords(next); setStore('purchases', next); setOpen(false); setEditing(INIT);
  }

  const F = (key: keyof typeof editing, label: string, type = 'text') => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input type={type} value={editing[key] as string | number}
        onChange={e => setEditing(p => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
        className="h-9" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} className="h-9 max-w-48" />
          {searchDate && <Button variant="ghost" size="sm" onClick={() => setSearchDate('')}>清除</Button>}
        </div>
        <div className="text-sm font-medium text-foreground">總計：<span className="text-primary">${totalSum.toLocaleString()}</span></div>
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setEditing(INIT); }}>
          <DialogTrigger asChild><Button size="sm" className="erp-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-1" />新增</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing.id ? '編輯' : '新增'}進貨紀錄</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {F('date', '日期', 'date')}
              {F('supplier', '供應商')}
              {F('itemName', '品項名稱')}
              <div className="grid grid-cols-3 gap-3">
                {F('quantity', '數量', 'number')}
                {F('unit', '單位')}
                {F('unitPrice', '單價', 'number')}
              </div>
              {F('paymentMethod', '付款方式')}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">盤點人員</label>
                <select value={editing.checker} onChange={e => setEditing(p => ({ ...p, checker: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">選擇人員</option>
                  {staffList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {F('notes', '備註')}
              <p className="text-xs font-medium text-muted-foreground mt-2">其他欄位</p>
              <div className="grid grid-cols-2 gap-3">
                {F('extra1Name', '欄位1名稱')}
                {F('extra1Value', '欄位1內容')}
                {F('extra2Name', '欄位2名稱')}
                {F('extra2Value', '欄位2內容')}
              </div>
              <Button onClick={save} className="w-full erp-gradient text-primary-foreground">儲存</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日期</TableHead><TableHead>供應商</TableHead><TableHead>品項</TableHead>
                <TableHead className="text-right">數量</TableHead><TableHead>單位</TableHead>
                <TableHead className="text-right">單價</TableHead><TableHead className="text-right">總額</TableHead>
                <TableHead>經手人</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">尚無資料</TableCell></TableRow>
              ) : filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.date}</TableCell>
                  <TableCell>{r.supplier}</TableCell><TableCell>{r.itemName}</TableCell>
                  <TableCell className="text-right">{r.quantity}</TableCell><TableCell>{r.unit}</TableCell>
                  <TableCell className="text-right">{r.unitPrice.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">{r.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>{r.checker}</TableCell>
                  <TableCell><Button variant="ghost" size="sm" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
