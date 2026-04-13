import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { getStore, setStore, genId } from '@/lib/store';
import { DENOMINATIONS } from '@/lib/inventoryData';
import type { ReserveFundRecord, ReserveDenomination } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Search, Trash2 } from 'lucide-react';
import ExcelImportExport from '@/components/ExcelImportExport';
import { toast } from 'sonner';

const INITIAL_DENOMINATIONS: ReserveDenomination[] = [
  { denomination: 500, quantity: 5, amount: 2500 },
  { denomination: 100, quantity: 20, amount: 2000 },
  { denomination: 50, quantity: 10, amount: 500 },
  { denomination: 10, quantity: 30, amount: 300 },
  { denomination: 5, quantity: 20, amount: 100 },
  { denomination: 1, quantity: 20, amount: 20 },
];

const makeDenoms = (): ReserveDenomination[] => DENOMINATIONS.map(d => ({ denomination: d, quantity: 0, amount: 0 }));

const INIT: Omit<ReserveFundRecord, 'id'> = {
  date: new Date().toISOString().slice(0, 10),
  denominations: makeDenoms(),
  handler: '', notes: '',
};

export default function ReserveFundPage() {
  const { staffList } = useAuth();
  const [records, setRecords] = useState<ReserveFundRecord[]>(() => getStore('reserve_fund'));
  const [editing, setEditing] = useState<Omit<ReserveFundRecord, 'id'> & { id?: string }>({ ...INIT, denominations: makeDenoms() });
  const [open, setOpen] = useState(false);
  const [searchDate, setSearchDate] = useState('');

  const filtered = useMemo(() => searchDate ? records.filter(r => r.date === searchDate) : records, [records, searchDate]);

  const currentBalance = useMemo(() => {
    const balByDenom: Record<number, number> = {};
    DENOMINATIONS.forEach(d => { balByDenom[d] = 0; });
    INITIAL_DENOMINATIONS.forEach(d => { balByDenom[d.denomination] = (balByDenom[d.denomination] || 0) + d.quantity; });
    records.forEach(r => {
      (r.denominations || []).forEach(d => {
        balByDenom[d.denomination] = (balByDenom[d.denomination] || 0) - d.quantity;
      });
    });
    return DENOMINATIONS.map(d => ({
      denomination: d,
      quantity: balByDenom[d] || 0,
      amount: (balByDenom[d] || 0) * d,
    }));
  }, [records]);

  const totalBalance = currentBalance.reduce((s, d) => s + d.amount, 0);

  function updateDenom(idx: number, quantity: number) {
    setEditing(p => {
      const denoms = [...p.denominations];
      denoms[idx] = { ...denoms[idx], quantity, amount: quantity * denoms[idx].denomination };
      return { ...p, denominations: denoms };
    });
  }

  function save() {
    const rec = { ...editing };
    let next: ReserveFundRecord[];
    if (rec.id) next = records.map(r => r.id === rec.id ? rec as ReserveFundRecord : r);
    else next = [...records, { ...rec, id: genId() } as ReserveFundRecord];
    setRecords(next); setStore('reserve_fund', next); setOpen(false);
    setEditing({ ...INIT, denominations: makeDenoms() });
  }

  function handleImport(rows: string[][]) {
    const header = rows[0];
    const dateIdx = header.findIndex(h => h.includes('日期'));
    const handlerIdx = header.findIndex(h => h.includes('盤點人員') || h.includes('經手') || h.includes('人員'));
    const notesIdx = header.findIndex(h => h.includes('備註'));
    // Excel format: 取出金額, 數量 columns - try to find denomination + quantity pairs
    const denomIdx = header.findIndex(h => h.includes('取出金額') || h.includes('幣值'));
    const qtyIdx = header.findIndex(h => h.includes('數量'));
    // Also support export format with individual denomination columns
    const denomIdxMap: Record<number, number> = {};
    DENOMINATIONS.forEach(d => {
      const idx = header.findIndex(h => h.trim() === `${d}元(數量)` || h.trim() === `${d}元` || h.trim() === `${d}`);
      if (idx >= 0) denomIdxMap[d] = idx;
    });
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
      let denoms: ReserveDenomination[];
      if (Object.keys(denomIdxMap).length > 0) {
        denoms = DENOMINATIONS.map(d => {
          const qty = denomIdxMap[d] !== undefined ? Number(r[denomIdxMap[d]] || 0) : 0;
          return { denomination: d, quantity: qty, amount: qty * d };
        });
      } else if (denomIdx >= 0 && qtyIdx >= 0) {
        const denomVal = Number(r[denomIdx] || 0);
        const qtyVal = Number(r[qtyIdx] || 0);
        denoms = DENOMINATIONS.map(d => ({
          denomination: d,
          quantity: d === denomVal ? qtyVal : 0,
          amount: d === denomVal ? qtyVal * d : 0,
        }));
      } else {
        denoms = makeDenoms();
      }
      if (denoms.every(d => d.quantity === 0) && !r[notesIdx]?.trim()) continue;
      next.push({ id: genId(), date: dateStr, denominations: denoms, handler: r[handlerIdx] || '', notes: r[notesIdx] || '' });
      added++;
    }
    setRecords(next); setStore('reserve_fund', next);
    toast.success(`匯入完成：新增 ${added} 筆`);
  }

  const exportHeaders = ['日期', ...DENOMINATIONS.map(d => `${d}元(數量)`), ...DENOMINATIONS.map(d => `${d}元(金額)`), '取出總額', '經手人', '備註'];

  return (
    <div className="space-y-4 print-area">
      <Card><CardHeader className="pb-3"><CardTitle className="text-base">目前預備金餘額</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {currentBalance.map(d => (
              <div key={d.denomination} className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground">{d.denomination}元</div>
                <div className="text-sm font-bold">{d.quantity}張/枚</div>
                <div className="text-xs text-primary">${d.amount.toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right text-sm font-bold">總餘額：<span className="text-primary text-lg">${totalBalance.toLocaleString()}</span></div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3 no-print">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} className="h-9 max-w-48" />
          {searchDate && <Button variant="ghost" size="sm" onClick={() => setSearchDate('')}>清除</Button>}
        </div>
        <ExcelImportExport
          exportHeaders={exportHeaders}
          exportRows={() => filtered.map(r => {
            const denoms = r.denominations || [];
            const total = denoms.reduce((s, d) => s + d.amount, 0);
            return [r.date, ...DENOMINATIONS.map(d => { const f = denoms.find(dd => dd.denomination === d); return f ? f.quantity : 0; }),
              ...DENOMINATIONS.map(d => { const f = denoms.find(dd => dd.denomination === d); return f ? f.amount : 0; }), total, r.handler, r.notes] as (string | number)[];
          })}
          exportFilename={`預備金_${new Date().toISOString().slice(0, 10)}`}
          onImport={handleImport}
        />
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setEditing({ ...INIT, denominations: makeDenoms() }); }}>
          <DialogTrigger asChild><Button size="sm" className="erp-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-1" />取出預備金</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing.id ? '編輯' : '新增'}取出預備金紀錄</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">日期</label>
                <Input type="date" value={editing.date} onChange={e => setEditing(p => ({ ...p, date: e.target.value }))} className="h-9" /></div>
              <p className="text-sm font-medium text-foreground">取出幣值與數量</p>
              <div className="space-y-2">
                {editing.denominations.map((d, idx) => (
                  <div key={d.denomination} className="grid grid-cols-3 gap-3 items-center">
                    <div className="text-sm font-medium">{d.denomination}元</div>
                    <Input type="number" placeholder="數量" value={d.quantity || ''} onChange={e => updateDenom(idx, Number(e.target.value))} className="h-9" />
                    <div className="text-sm text-right text-primary font-medium">${d.amount.toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex justify-between text-sm font-bold">
                  <span>取出總額</span>
                  <span className="text-destructive">${editing.denominations.reduce((s, d) => s + d.amount, 0).toLocaleString()}</span>
                </div>
              </div>
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
              <Button onClick={save} className="w-full erp-gradient text-primary-foreground">儲存</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>日期</TableHead>
            {DENOMINATIONS.map(d => <TableHead key={d} className="text-right">{d}元</TableHead>)}
            <TableHead className="text-right">取出總額</TableHead>
            <TableHead>經手人</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">尚無資料</TableCell></TableRow>
            : filtered.map(r => {
              const total = (r.denominations || []).reduce((s, d) => s + d.amount, 0);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.date}</TableCell>
                  {DENOMINATIONS.map(d => {
                    const found = (r.denominations || []).find(dd => dd.denomination === d);
                    return <TableCell key={d} className="text-right">{found && found.quantity ? `${found.quantity}` : '-'}</TableCell>;
                  })}
                  <TableCell className="text-right font-medium text-destructive">${total.toLocaleString()}</TableCell>
                  <TableCell>{r.handler}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing({ ...r, denominations: r.denominations || makeDenoms() }); setOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { if (confirm('確定刪除此筆資料？')) { const next = records.filter(x => x.id !== r.id); setRecords(next); setStore('reserve_fund', next); } }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
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
