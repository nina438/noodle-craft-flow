import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { getStore, setStore, genId } from '@/lib/store';
import type { PettyCashRecord } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Search } from 'lucide-react';

const INIT: Omit<PettyCashRecord, 'id'> = {
  date: new Date().toISOString().slice(0, 10), description: '', category: '',
  amount: 0, handler: '', notes: '',
  extra1Name: '', extra1Value: '', extra2Name: '', extra2Value: '',
};

export default function PettyCashPage() {
  const { staffList } = useAuth();
  const [records, setRecords] = useState<PettyCashRecord[]>(() => getStore('petty_cash'));
  const [editing, setEditing] = useState<Omit<PettyCashRecord, 'id'> & { id?: string }>(INIT);
  const [open, setOpen] = useState(false);
  const [searchDate, setSearchDate] = useState('');

  const filtered = useMemo(() => searchDate ? records.filter(r => r.date === searchDate) : records, [records, searchDate]);
  const totalSum = useMemo(() => filtered.reduce((s, r) => s + r.amount, 0), [filtered]);

  function save() {
    let next: PettyCashRecord[];
    if (editing.id) next = records.map(r => r.id === editing.id ? editing as PettyCashRecord : r);
    else next = [...records, { ...editing, id: genId() } as PettyCashRecord];
    setRecords(next); setStore('petty_cash', next); setOpen(false); setEditing(INIT);
  }

  const F = (key: keyof typeof editing, label: string, type = 'text') => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input type={type} value={editing[key] as string | number}
        onChange={e => setEditing(p => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))} className="h-9" />
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
        <div className="text-sm font-medium">總支出：<span className="text-destructive">${totalSum.toLocaleString()}</span></div>
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setEditing(INIT); }}>
          <DialogTrigger asChild><Button size="sm" className="erp-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-1" />新增</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing.id ? '編輯' : '新增'}零用金支出</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {F('date', '日期', 'date')}{F('description', '支出說明')}{F('category', '分類')}{F('amount', '金額', 'number')}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">經手人</label>
                <select value={editing.handler} onChange={e => setEditing(p => ({ ...p, handler: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">選擇</option>
                  {staffList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {F('notes', '備註')}
              <p className="text-xs font-medium text-muted-foreground">其他欄位</p>
              <div className="grid grid-cols-2 gap-3">
                {F('extra1Name', '欄位1名稱')}{F('extra1Value', '欄位1內容')}{F('extra2Name', '欄位2名稱')}{F('extra2Value', '欄位2內容')}
              </div>
              <Button onClick={save} className="w-full erp-gradient text-primary-foreground">儲存</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>日期</TableHead><TableHead>說明</TableHead><TableHead>分類</TableHead>
            <TableHead className="text-right">金額</TableHead><TableHead>經手人</TableHead><TableHead>備註</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">尚無資料</TableCell></TableRow>
            : filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.date}</TableCell><TableCell>{r.description}</TableCell><TableCell>{r.category}</TableCell>
                <TableCell className="text-right font-medium">{r.amount.toLocaleString()}</TableCell><TableCell>{r.handler}</TableCell><TableCell className="text-muted-foreground text-xs">{r.notes}</TableCell>
                <TableCell><Button variant="ghost" size="sm" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
