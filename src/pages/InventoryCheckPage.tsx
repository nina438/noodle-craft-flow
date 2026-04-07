import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { getStore, setStore, genId } from '@/lib/store';
import { getDefaultInventory } from '@/lib/inventoryData';
import type { InventoryItem } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Save } from 'lucide-react';

interface DailyRecord {
  id: string;
  date: string;
  items: { name: string; unit: string; quantity: number }[];
  checker: string;
  notes: string;
  extra1Name: string; extra1Value: string;
  extra2Name: string; extra2Value: string;
}

interface Props {
  storeKey: string;
  categoryFilter: string[];
  title: string;
}

export default function InventoryCheckPage({ storeKey, categoryFilter, title }: Props) {
  const { staffList } = useAuth();
  const inventory = useMemo(() => getDefaultInventory().filter(i => categoryFilter.includes(i.category)), []);
  const [records, setRecords] = useState<DailyRecord[]>(() => getStore(storeKey));
  const [searchDate, setSearchDate] = useState('');
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [checker, setChecker] = useState('');
  const [notes, setNotes] = useState('');
  const [extra1Name, setExtra1Name] = useState('');
  const [extra1Value, setExtra1Value] = useState('');
  const [extra2Name, setExtra2Name] = useState('');
  const [extra2Value, setExtra2Value] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => searchDate ? records.filter(r => r.date === searchDate) : records, [records, searchDate]);

  function startNew() {
    setEditingId(null);
    setDate(new Date().toISOString().slice(0, 10));
    setChecker(''); setNotes('');
    setExtra1Name(''); setExtra1Value(''); setExtra2Name(''); setExtra2Value('');
    setQuantities({});
    setOpen(true);
  }

  function startEdit(r: DailyRecord) {
    setEditingId(r.id);
    setDate(r.date); setChecker(r.checker); setNotes(r.notes);
    setExtra1Name(r.extra1Name); setExtra1Value(r.extra1Value);
    setExtra2Name(r.extra2Name); setExtra2Value(r.extra2Value);
    const q: Record<string, number> = {};
    r.items.forEach(i => { q[i.name] = i.quantity; });
    setQuantities(q);
    setOpen(true);
  }

  function save() {
    const items = inventory.map(i => ({ name: i.name, unit: i.unit, quantity: quantities[i.name] || 0 }));
    const rec: DailyRecord = { id: editingId || genId(), date, items, checker, notes, extra1Name, extra1Value, extra2Name, extra2Value };
    let next: DailyRecord[];
    if (editingId) next = records.map(r => r.id === editingId ? rec : r);
    else next = [...records, rec];
    setRecords(next); setStore(storeKey, next); setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} className="h-9 max-w-48" />
          {searchDate && <Button variant="ghost" size="sm" onClick={() => setSearchDate('')}>清除</Button>}
        </div>
        <Button size="sm" className="erp-gradient text-primary-foreground" onClick={startNew}><Plus className="w-4 h-4 mr-1" />新增盤點</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? '編輯' : '新增'}{title}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">日期</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">盤點人員</label>
                <select value={checker} onChange={e => setChecker(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">選擇</option>
                  {staffList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="w-8">#</TableHead><TableHead>品項</TableHead><TableHead>單位</TableHead><TableHead className="w-28">數量</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {inventory.map((item, idx) => (
                    <TableRow key={item.name}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="text-sm font-medium">{item.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.unit}</TableCell>
                      <TableCell>
                        <Input type="number" value={quantities[item.name] || ''} placeholder="0"
                          onChange={e => setQuantities(p => ({ ...p, [item.name]: Number(e.target.value) }))}
                          className="h-8 text-sm" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">備註</label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} className="h-9" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">其他欄位</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">欄位1名稱</label><Input value={extra1Name} onChange={e => setExtra1Name(e.target.value)} className="h-9" /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">欄位1內容</label><Input value={extra1Value} onChange={e => setExtra1Value(e.target.value)} className="h-9" /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">欄位2名稱</label><Input value={extra2Name} onChange={e => setExtra2Name(e.target.value)} className="h-9" /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-muted-foreground">欄位2內容</label><Input value={extra2Value} onChange={e => setExtra2Value(e.target.value)} className="h-9" /></div>
            </div>
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
                <TableCell><Button variant="ghost" size="sm" onClick={() => startEdit(r)}>查看/編輯</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
