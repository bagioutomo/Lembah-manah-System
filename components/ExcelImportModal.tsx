
import React, { useState, useRef } from 'react';
// Fix: Added missing 'Info' icon to the imports from lucide-react
import { X, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Loader2, Table, Save, ShieldCheck, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ExpenseRecord, UserRole } from '../types';

interface Props {
  show: boolean;
  onClose: () => void;
  onImport: (data: ExpenseRecord[]) => void;
  userRole: UserRole;
  wallets: string[];
  categories: string[];
}

const ExcelImportModal: React.FC<Props> = ({ show, onClose, onImport, userRole, wallets, categories }) => {
  const [step, setStep] = useState<'UPLOAD' | 'PREVIEW' | 'SUCCESS'>('UPLOAD');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!show) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Skip header row
        const rows = data.slice(1);
        const validatedRecords: any[] = [];

        rows.forEach((row: any, index) => {
          if (row.length < 4) return; // Baris kosong

          const [date, notes, qty, amount, wallet, category] = row;
          
          // Basic Validation
          validatedRecords.push({
            id: `exp-xl-${Date.now()}-${index}`,
            date: date || new Date().toISOString().split('T')[0],
            notes: (notes || 'IMPORT EXCEL').toString().toUpperCase(),
            qty: parseFloat(qty) || 1,
            amount: parseFloat(amount) || 0,
            wallet: wallet || wallets[0] || 'Cash Naim',
            category: category || categories[0] || 'Lain-lain',
            timestamp: new Date().toISOString(),
            createdBy: userRole
          });
        });

        if (validatedRecords.length === 0) {
          throw new Error("File Excel kosong atau format kolom tidak sesuai.");
        }

        setParsedData(validatedRecords);
        setStep('PREVIEW');
      } catch (err: any) {
        setError(err.message || "Gagal membaca file Excel.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onImport(parsedData);
      setStep('SUCCESS');
      setIsProcessing(false);
    }, 1500);
  };

  const reset = () => {
    setStep('UPLOAD');
    setParsedData([]);
    setError(null);
    onClose();
  };

  const downloadTemplate = () => {
    const templateData = [
      ["Tanggal", "Keterangan", "Qty", "Harga Satuan", "Dompet", "Kategori"],
      ["2024-03-20", "PEMBELIAN BIJI KOPI", 5, 150000, "Cash Naim", "Bahan Baku Bar"],
      ["2024-03-21", "PEMBAYARAN LISTRIK", 1, 2500000, "BRI", "Listrik"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_lmk");
    XLSX.writeFile(wb, "Template_Import_LembahManah.xlsx");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={reset} />
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 animate-scale-in border-t-8 border-emerald-600">
        
        {step === 'UPLOAD' && (
          <div className="text-center space-y-8">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-inner">
               <FileSpreadsheet size={40} />
            </div>
            <div>
               <h3 className="text-3xl font-black uppercase tracking-tighter">Mass Import Excel</h3>
               <p className="text-sm text-gray-500 font-medium italic mt-2">Upload ribuan data pengeluaran sekaligus dalam hitungan detik.</p>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group cursor-pointer p-16 border-4 border-dashed border-gray-100 dark:border-gray-800 rounded-[2.5rem] hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex flex-col items-center gap-4"
            >
               {isProcessing ? (
                 <Loader2 size={48} className="animate-spin text-emerald-600" />
               ) : (
                 <>
                   <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full group-hover:scale-110 transition-transform">
                      <Download size={32} className="text-gray-400 group-hover:text-emerald-600" />
                   </div>
                   <p className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-emerald-700">Klik atau seret file .xlsx ke sini</p>
                 </>
               )}
               <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 text-rose-600 font-bold text-xs uppercase animate-pulse">
                <AlertCircle size={14}/> {error}
              </div>
            )}

            <button onClick={downloadTemplate} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline flex items-center justify-center gap-2 mx-auto">
               <Download size={14}/> Unduh Template Excel Bapak
            </button>
          </div>
        )}

        {step === 'PREVIEW' && (
          <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Table size={24}/></div>
                   <h3 className="text-xl font-black uppercase tracking-tighter">Audit Pratinjau ({parsedData.length} Baris)</h3>
                </div>
                <button onClick={() => setStep('UPLOAD')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-600">Ganti File</button>
             </div>

             <div className="max-h-[40vh] overflow-y-auto rounded-2xl border dark:border-gray-800 shadow-inner">
                <table className="w-full text-left">
                   <thead className="sticky top-0 bg-gray-900 text-white text-[9px] font-black uppercase">
                      <tr>
                        <th className="p-4">Tgl</th>
                        <th className="p-4">Keterangan</th>
                        <th className="p-4 text-center">Qty</th>
                        <th className="p-4 text-right">Nominal</th>
                        <th className="p-4">Dompet</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y dark:divide-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                      {parsedData.map((row, i) => (
                        <tr key={i} className="text-[10px] font-bold uppercase text-gray-600 dark:text-gray-400">
                           <td className="p-4">{row.date}</td>
                           <td className="p-4 truncate max-w-[150px]">{row.notes}</td>
                           <td className="p-4 text-center">{row.qty}</td>
                           <td className="p-4 text-right">{row.amount.toLocaleString('id-ID')}</td>
                           <td className="p-4">{row.wallet}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] border-2 border-dashed border-blue-200 dark:border-blue-800 flex gap-4">
                <Info size={24} className="text-blue-600 shrink-0 mt-1" />
                <p className="text-[10px] text-blue-800 dark:text-blue-300 font-medium leading-relaxed italic uppercase">
                  <b>Peringatan Audit:</b> Pastikan nama Dompet dan Kategori di Excel sudah sama persis dengan yang ada di aplikasi agar sistem bisa melakukan sinkronisasi dengan benar.
                </p>
             </div>

             <button 
               onClick={handleConfirmImport} 
               disabled={isProcessing}
               className="w-full py-6 bg-emerald-600 text-white rounded-[1.8rem] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 hover:bg-emerald-700 active:scale-95 transition-all"
             >
                {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <><Save size={24}/> Konfirmasi & Simpan Massal</>}
             </button>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="text-center py-10 space-y-8 animate-scale-in">
             <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                <CheckCircle2 size={64} className="animate-bounce" />
             </div>
             <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">Impor Berhasil!</h3>
                <p className="text-sm text-gray-500 font-medium italic mt-2">Data Excel Bapak sudah aman tersinkron ke seluruh titik cermin cloud.</p>
             </div>
             <button onClick={reset} className="px-12 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Kembali ke Dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelImportModal;
