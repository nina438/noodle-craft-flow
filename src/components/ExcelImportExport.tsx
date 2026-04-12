import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { exportToExcel, exportToCSV, parseExcelFile } from '@/lib/exportUtils';
import { toast } from 'sonner';

interface Props {
  exportHeaders: string[];
  exportRows: () => (string | number)[][];
  exportFilename: string;
  onImport: (rows: string[][]) => void;
}

export default function ExcelImportExport({ exportHeaders, exportRows, exportFilename, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseExcelFile(file);
      if (rows.length < 2) { toast.error('檔案內容不足'); return; }
      onImport(rows);
    } catch (err) {
      toast.error('匯入失敗：' + (err instanceof Error ? err.message : '未知錯誤'));
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => exportToCSV(exportHeaders, exportRows(), exportFilename)}>
        <Download className="w-4 h-4 mr-1" />CSV
      </Button>
      <Button variant="outline" size="sm" onClick={() => exportToExcel(exportHeaders, exportRows(), exportFilename)}>
        <Download className="w-4 h-4 mr-1" />Excel
      </Button>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
        <Upload className="w-4 h-4 mr-1" />匯入Excel
      </Button>
    </>
  );
}
