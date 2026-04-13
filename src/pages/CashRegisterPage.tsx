import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { getStore, setStore, genId } from '@/lib/store';
import type { CashRegisterRecord } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Search, Trash2 } from 'lucide-react';
import ExcelImportExport from '@/components/ExcelImportExport';
import { toast } from 'sonner';

const ORIGINAL_RESERVE = 5420;

const INITIAL: Omit<CashRegisterRecord, 'id'> = {
  date: new Date().toISOString().slice(0, 10), bills1000: 0, bills500: 0, bills100: 0,
  coins50: 0, coins10: 0, coins5: 0, coins1: 0, other: 0, cashTotal: 0,
  storeCashRevenue: 0, onlinePayment: 0, totalRevenue: 0, actualReceived: 0,
  originalReserve: ORIGINAL_RESERVE, profitLoss: 0, checker: '', notes: '',
};

export default function CashRegisterPage() {
  const { staffList } = useAuth();
  const [records, setRecords] = useState<CashRegisterRecord[]>(() => getStore('cash_register'));
  const [editing, setEditing] = useState<Omit<CashRegisterRecord, 'id'> & { id?: string }>(INITIAL);
  const [open, setOpen] = useState(false);
  const [searchDate, setSearchDate] = useState('');

  const filtered = useMemo(() => searchDate ? records.filter(r => r.date === searchDate) : records, [records, searchDate]);

  function calcTotals(r: typeof editing) {
    const cashTotal = r.bills1000 * 1000 + r.bills500 * 500 + r.bills100 * 100 +
      r.coins50 * 50 + r.coins10 * 10 + r.coins5 * 5 + r.coins1 * 1 + r.other;
    const totalRevenue = r.storeCashRevenue + r.onlinePayment;
    const actualReceived = cashTotal - r.originalReserve;
    const profitLoss = actualReceived - totalRevenue;
    return { ...r, cashTotal, totalRevenue, actualReceived, profitLoss };
  }

  const computed = useMemo(() => calcTotals(editing), [editing]);

  function save() {
    const rec = calcTotals(editing);
    let next: CashRegisterRecord[];
    if (rec.id) next = records.map(r => r.id === rec.id ? rec as CashRegisterRecord : r);
    else next = [...records, { ...rec, id: genId() } as CashRegisterRecord];
    setRecords(next); setStore('cash_register', next); setOpen(false); setEditing(INITIAL);
  }

  function handleImport(rows: string[][]) {
    const header = rows[0];
    const includesIdx = (keywords: string[]) => header.findIndex(h => keywords.some(k => h.includes(k)));
    // Match denomination columns: support both "1000元" and exact "1000"
    const denomIdx = (val: string) => {
      let idx = header.findIndex(h => h.trim() === `${val}元`);
      if (idx < 0) idx = header.findIndex(h => h.trim() === val);
      if (idx < 0) idx = header.findIndex(h => h.trim().startsWith(val) && !header.some((h2, j) => j !== header.indexOf(h) && h2.trim().startsWith(val)));
      return idx;
    };
    const dateIdx = includesIdx(['日期']);
    const b1000 = denomIdx('1000');
    const b500 = denomIdx('500');
    const b100 = header.findIndex(h => h.trim() === '100元' || h.trim() === '100');
    const c50 = header.findIndex(h => h.trim() === '50元' || h.trim() === '50');
    const c10Idx = header.findIndex(h => h.trim() === '10元' || h.trim() === '10');
    const c5 = header.findIndex(h => h.trim() === '5元' || h.trim() === '5');
    const c1 = header.findIndex(h => h.trim() === '1元' || h.trim() === '1');
    const otherIdx = includesIdx(['其他']);
    const storeIdx = includesIdx(['門市']);
    const onlineIdx = includesIdx(['線上']);
    const checkerIdx = includesIdx(['盤點人員', '人員']);
    const notesIdx = includesIdx(['備註']);

    let added = 0;
    const next = [...records];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const dateVal = r[dateIdx >= 0 ? dateIdx : 0]?.trim();
      if (!dateVal) continue;
      // Handle Excel serial date numbers
      let dateStr = dateVal;
      if (/^\d{5}$/.test(dateVal)) {
        const d = new Date((Number(dateVal) - 25569) * 86400000);
        dateStr = d.toISOString().slice(0, 10);
      } else if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(dateVal)) {
        dateStr = dateVal.replace(/\//g, '-').slice(0, 10);
      }
      const rec: Omit<CashRegisterRecord, 'id'> = {
        date: dateStr, bills1000: Number(r[b1000] || 0), bills500: Number(r[b500] || 0),
        bills100: Number(r[b100] || 0), coins50: Number(r[c50] || 0), coins10: Number(r[c10Idx] || 0),
        coins5: Number(r[c5] || 0), coins1: Number(r[c1] || 0), other: Number(r[otherIdx] || 0), cashTotal: 0,
        storeCashRevenue: Number(r[storeIdx] || 0), onlinePayment: Number(r[onlineIdx] || 0),
        totalRevenue: 0, actualReceived: 0, originalReserve: ORIGINAL_RESERVE, profitLoss: 0,
        checker: r[checkerIdx] || '', notes: r[notesIdx] || '',
      };
      const calculated = calcTotals(rec);
      next.push({ ...calculated, id: genId() } as CashRegisterRecord);
      added++;
    }
    setRecords(next); setStore('cash_register', next);
    toast.success(`匯入完成：新增 ${added} 筆`);
  }

  const exportHeaders = ['日期', '1000元', '500元', '100元', '50元', '10元', '5元', '1元', '錢櫃現金', '門市現金', '線上支付', '總營收', '實收金額', '預備金', '損溢', '盤點人員', '備註'];

  const F = (key: keyof typeof editing, label: string, type = 'number') => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input type={type} value={editing[key] as string | number}
        onChange={e => setEditing(prev => ({ ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))} className="h-9" />
    </div>
  );

  return (
    <div className="space-y-4 print-area">
      <div className="flex flex-wrap items-center gap-3 no-print">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} className="h-9 max-w-48" />
          {searchDate && <Button variant="ghost" size="sm" onClick={() => setSearchDate('')}>清除</Button>}
        </div>
        <ExcelImportExport
          exportHeaders={exportHeaders}
          exportRows={() => filtered.map(r => [r.date, r.bills1000, r.bills500, r.bills100, r.coins50, r.coins10, r.coins5, r.coins1, r.cashTotal, r.storeCashRevenue, r.onlinePayment, r.totalRevenue, r.actualReceived, r.originalReserve, r.profitLoss, r.checker, r.notes])}
          exportFilename={`錢櫃營收_${new Date().toISOString().slice(0, 10)}`}
          onImport={handleImport}
        />
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setEditing(INITIAL); }}>
          <DialogTrigger asChild><Button size="sm" className="erp-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-1" />新增紀錄</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing.id ? '編輯' : '新增'}錢櫃營收紀錄</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {F('date', '日期', 'date')}
              <p className="text-sm font-medium text-foreground">鈔券清點</p>
              <div className="grid grid-cols-4 gap-3">
                {F('bills1000', '1000元')}{F('bills500', '500元')}{F('bills100', '100元')}{F('coins50', '50元')}
                {F('coins10', '10元')}{F('coins5', '5元')}{F('coins1', '1元')}{F('other', '其他')}
              </div>
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">錢櫃現金總額</span><span className="font-bold">${computed.cashTotal.toLocaleString()}</span></div>
              </div>
              <p className="text-sm font-medium text-foreground">營收資訊</p>
              <div className="grid grid-cols-2 gap-3">
                {F('storeCashRevenue', '門市營收(現金)')}{F('onlinePayment', '線上支付')}{F('originalReserve', '原始預備金')}
              </div>
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">總營收(應收)</span><span className="font-bold">${computed.totalRevenue.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">實收金額(自動計算)</span><span className="font-bold">${computed.actualReceived.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">損溢</span><span className={`font-bold ${computed.profitLoss < 0 ? 'text-destructive' : computed.profitLoss > 0 ? 'text-success' : ''}`}>${computed.profitLoss.toLocaleString()}</span></div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">盤點人員</label>
                <select value={editing.checker} onChange={e => setEditing(p => ({ ...p, checker: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">選擇人員</option>
                  {staffList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {F('notes', '備註', 'text')}
              <Button onClick={save} className="w-full erp-gradient text-primary-foreground">儲存</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>日期</TableHead><TableHead className="text-right">錢櫃現金</TableHead>
            <TableHead className="text-right">門市現金</TableHead><TableHead className="text-right">線上支付</TableHead>
            <TableHead className="text-right">總營收</TableHead><TableHead className="text-right">實收金額</TableHead>
            <TableHead className="text-right">損溢</TableHead><TableHead>盤點人員</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">尚無資料</TableCell></TableRow>
            : filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.date}</TableCell>
                <TableCell className="text-right">{r.cashTotal.toLocaleString()}</TableCell>
                <TableCell className="text-right">{r.storeCashRevenue.toLocaleString()}</TableCell>
                <TableCell className="text-right">{r.onlinePayment.toLocaleString()}</TableCell>
                <TableCell className="text-right">{r.totalRevenue.toLocaleString()}</TableCell>
                <TableCell className="text-right">{r.actualReceived.toLocaleString()}</TableCell>
                <TableCell className={`text-right font-medium ${r.profitLoss < 0 ? 'text-destructive' : r.profitLoss > 0 ? 'text-success' : ''}`}>{r.profitLoss.toLocaleString()}</TableCell>
                <TableCell>{r.checker}</TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => { if (confirm('確定刪除此筆資料？')) { const next = records.filter(x => x.id !== r.id); setRecords(next); setStore('cash_register', next); } }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
