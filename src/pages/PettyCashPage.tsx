import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { getStore, setStore, genId } from '@/lib/store';
import type { PettyCashRecord, PettyCashExtraRow } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Search, Trash2 } from 'lucide-react';
import ExcelImportExport from '@/components/ExcelImportExport';
import { toast } from 'sonner';

const emptyExtra = (): PettyCashExtraRow => ({ description: '', type: 'expense', amount: 0 });

const INIT: Omit<PettyCashRecord, 'id'> = {
  date: new Date().toISOString().slice(0, 10), description: '', type: 'expense',
  amount: 0, handler: '', notes: '',
  extraRows: Array.from({ length: 5 }, emptyExtra),
};

export default function PettyCashPage() {
  const { staffList } = useAuth();
  const [records, setRecords] = useState<PettyCashRecord[]>(() => getStore('petty_cash'));
  const [editing, setEditing] = useState<Omit<PettyCashRecord, 'id'> & { id?: string }>({ ...INIT, extraRows: INIT.extraRows.map(r => ({ ...r })) });
  const [open, setOpen] = useState(false);
  const [searchDate, setSearchDate] = useState('');

  const filtered = useMemo(() => searchDate ? records.filter(r => r.date === searchDate) : records, [records, searchDate]);

  const balance = useMemo(() => {
    let bal = 0;
    records.forEach(r => {
      bal += r.type === 'income' ? r.amount : -r.amount;
      (r.extraRows || []).forEach(er => {
        if (er.description || er.amount) bal += er.type === 'income' ? er.amount : -er.amount;
      });
    });
    return bal;
  }, [records]);

  function save() {
    let next: PettyCashRecord[];
    const rec = { ...editing, extraRows: editing.extraRows || [] };
    if (rec.id) next = records.map(r => r.id === rec.id ? rec as PettyCashRecord : r);
    else next = [...records, { ...rec, id: genId() } as PettyCashRecord];
    setRecords(next); setStore('petty_cash', next); setOpen(false);
    setEditing({ ...INIT, extraRows: INIT.extraRows.map(r => ({ ...r })) });
  }

  function updateExtra(idx: number, field: keyof PettyCashExtraRow, value: string | number) {
    setEditing(p => {
      const rows = [...p.extraRows];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...p, extraRows: rows };
    });
  }

  function handleImport(rows: string[][]) {
    const header = rows[0];
    const map = (kw: string[]) => header.findIndex(h => kw.some(k => h.includes(k)));
    const dateIdx = map(['日期']);
    const descIdx = map(['項目', '說明', '描述']);
    const incomeIdx = header.findIndex(h => h.includes('收入') && h.includes('金額'));
    const expenseIdx = header.findIndex(h => h.includes('支出') && h.includes('金額'));
    const singleAmtIdx = incomeIdx < 0 && expenseIdx < 0 ? map(['金額']) : -1;
    const typeIdx = map(['類型', '收支']);
    const handlerIdx = map(['盤點人員', '經手', '人員']);
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
      // Determine type and amount from separate income/expense columns or single column
      let type: 'income' | 'expense' = 'expense';
      let amount = 0;
      if (incomeIdx >= 0 && expenseIdx >= 0) {
        const inc = Number(r[incomeIdx] || 0);
        const exp = Number(r[expenseIdx] || 0);
        if (inc > 0) { type = 'income'; amount = inc; }
        else { type = 'expense'; amount = exp; }
      } else if (singleAmtIdx >= 0) {
        amount = Math.abs(Number(r[singleAmtIdx] || 0));
        if (typeIdx >= 0) type = r[typeIdx]?.includes('收') ? 'income' : 'expense';
      }
      if (amount === 0 && !r[descIdx]?.trim()) continue;
      next.push({
        id: genId(), date: dateStr,
        description: r[descIdx] || '', type, amount,
        handler: r[handlerIdx] || '', notes: r[notesIdx] || '',
        extraRows: [],
      });
      added++;
    }
    setRecords(next); setStore('petty_cash', next);
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
        <div className="text-sm font-medium">目前餘額：<span className={balance >= 0 ? 'text-success' : 'text-destructive'}>${balance.toLocaleString()}</span></div>
        <ExcelImportExport
          exportHeaders={['日期', '說明', '類型', '金額', '經手人', '備註']}
          exportRows={() => filtered.map(r => [r.date, r.description, r.type === 'income' ? '收入' : '支出', r.amount, r.handler, r.notes])}
          exportFilename={`零用金_${new Date().toISOString().slice(0, 10)}`}
          onImport={handleImport}
        />
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setEditing({ ...INIT, extraRows: INIT.extraRows.map(r => ({ ...r })) }); }}>
          <DialogTrigger asChild><Button size="sm" className="erp-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-1" />新增</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing.id ? '編輯' : '新增'}零用金紀錄</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">日期</label>
                  <Input type="date" value={editing.date} onChange={e => setEditing(p => ({ ...p, date: e.target.value }))} className="h-9" /></div>
                <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">收入/支出</label>
                  <select value={editing.type} onChange={e => setEditing(p => ({ ...p, type: e.target.value as 'income' | 'expense' }))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="income">收入</option><option value="expense">支出</option>
                  </select></div>
              </div>
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">支出/收入說明</label>
                <Input value={editing.description} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))} className="h-9" /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">金額</label>
                <Input type="number" value={editing.amount} onChange={e => setEditing(p => ({ ...p, amount: Number(e.target.value) }))} className="h-9" /></div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">經手人</label>
                <select value={editing.handler} onChange={e => setEditing(p => ({ ...p, handler: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">選擇</option>
                  {staffList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">備註</label>
                <Input value={editing.notes} onChange={e => setEditing(p => ({ ...p, notes: e.target.value }))} className="h-9" /></div>
              <p className="text-sm font-medium text-foreground mt-2">其他欄位</p>
              {editing.extraRows.map((row, idx) => (
                <div key={idx} className="p-3 border rounded-lg space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">其他欄位 {idx + 1}</span>
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="支出說明" value={row.description} onChange={e => updateExtra(idx, 'description', e.target.value)} className="h-8 text-xs" />
                    <select value={row.type} onChange={e => updateExtra(idx, 'type', e.target.value)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                      <option value="income">收入</option><option value="expense">支出</option>
                    </select>
                    <Input type="number" placeholder="金額" value={row.amount || ''} onChange={e => updateExtra(idx, 'amount', Number(e.target.value))} className="h-8 text-xs" />
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
            <TableHead>日期</TableHead><TableHead>說明</TableHead><TableHead>類型</TableHead>
            <TableHead className="text-right">金額</TableHead><TableHead>經手人</TableHead><TableHead>備註</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">尚無資料</TableCell></TableRow>
            : filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.date}</TableCell><TableCell>{r.description}</TableCell>
                <TableCell><span className={`px-2 py-0.5 rounded text-xs font-medium ${r.type === 'income' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{r.type === 'income' ? '收入' : '支出'}</span></TableCell>
                <TableCell className="text-right font-medium">{r.amount.toLocaleString()}</TableCell><TableCell>{r.handler}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{r.notes}</TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing({ ...r, extraRows: r.extraRows || Array.from({ length: 5 }, emptyExtra) }); setOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => { if (confirm('確定刪除此筆資料？')) { const next = records.filter(x => x.id !== r.id); setRecords(next); setStore('petty_cash', next); } }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
