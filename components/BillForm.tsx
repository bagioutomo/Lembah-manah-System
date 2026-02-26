
import React, { useState, useMemo } from 'react';
import { Receipt, Truck, Plus, Trash2, Calculator, Save, Package } from 'lucide-react';
import { BillRecord, BillItem, Supplier, UserRole } from '../types';

interface Props {
  onSubmit: (data: BillRecord) => void;
  categories: string[];
  suppliers: Supplier[];
  userRole: UserRole;
}

const BillForm: React.FC<Props> = ({ onSubmit, categories, suppliers, userRole }) => {
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [billData, setBillData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    category: '',
    notes: ''
  });

  const totalBillAmount = useMemo(() => {
    return billItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [billItems]);

  const handleAddBillItem = () => {
    const newItem: BillItem = {
      description: '',
      qty: 1,
      unitPrice: 0,
      amount: 0,
      category: billData.category || (categories.length > 0 ? categories[0] : '')
    };
    setBillItems([...billItems, newItem]);
  };

  const updateBillItem = (index: number, field: keyof BillItem, value: any) => {
    const newItems = [...billItems];
    const item = { ...newItems[index], [field]: value };
    if (field === 'qty' || field === 'unitPrice') {
      item.amount = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);
    }
    newItems[index] = item;
    setBillItems(newItems);
  };

  const removeBillItem = (index: number) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const handleBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billData.title) return alert('Input nama suplier/vendor!');
    if (billItems.length === 0) return alert('Tambahkan minimal 1 item belanja!');
    const record: BillRecord = {
      id: `bill-${Date.now()}`,
      ...billData,
      amount: totalBillAmount,
      status: 'UNPAID',
      items: billItems,
      timestamp: new Date().toISOString()
    };
    onSubmit(record);
    alert('Tagihan baru berhasil didaftarkan!');
    setBillData({ title: '', date: new Date().toISOString().split('T')[0], dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: '', notes: '' });
    setBillItems([]);
  };

  const formatCurrency = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-5 mb-6">
         <div className="p-5 rounded-[2rem] text-white shadow-xl bg-indigo-600">
            <Receipt size={32}/>
         </div>
         <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none dark:text-white">Daftar Tagihan Baru</h2>
            <p className="text-sm text-gray-500 font-medium italic mt-2 uppercase tracking-widest">Input Nota Hutang Vendor</p>
         </div>
      </div>

      <form onSubmit={handleBillSubmit} className="bg-white dark:bg-gray-900 rounded-[3rem] p-10 border border-gray-100 dark:border-gray-800 shadow-2xl space-y-8">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nama Suplier / Vendor</label>
               <div className="relative">
                  <input list="suppliers" value={billData.title} onChange={e => setBillData({...billData, title: e.target.value.toUpperCase()})} placeholder="PILIH ATAU KETIK..." className="w-full bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl outline-none font-black text-sm uppercase" />
                  <datalist id="suppliers">
                     {suppliers.map(s => <option key={s.id} value={s.name} />)}
                  </datalist>
                  <Truck size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Tgl Tagihan</label>
                  <input type="date" value={billData.date} onChange={e => setBillData({...billData, date: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl outline-none font-black text-xs" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-red-600 uppercase tracking-widest ml-4">Jatuh Tempo</label>
                  <input type="date" value={billData.dueDate} onChange={e => setBillData({...billData, dueDate: e.target.value})} className="w-full bg-red-50 dark:bg-red-950/20 p-5 rounded-2xl outline-none font-black text-xs text-red-600" />
               </div>
            </div>
         </div>

         <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2"><Package size={18}/> Rincian Item Belanja</h3>
               <button type="button" onClick={handleAddBillItem} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-600 hover:text-white transition-all"><Plus size={14}/> Tambah Item</button>
            </div>
            
            <div className="space-y-3">
               {billItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 relative group">
                     <div className="md:col-span-4 space-y-1">
                        <label className="text-[8px] font-black text-gray-400 uppercase ml-1">Nama Item</label>
                        <input type="text" value={item.description} onChange={e => updateBillItem(idx, 'description', e.target.value.toUpperCase())} placeholder="TELUR / KOPI" className="w-full bg-white dark:bg-gray-900 px-3 py-2 rounded-lg outline-none font-bold text-xs" />
                     </div>
                     <div className="md:col-span-3 space-y-1">
                        <label className="text-[8px] font-black text-gray-400 uppercase ml-1">Kategori</label>
                        <select value={item.category} onChange={e => updateBillItem(idx, 'category', e.target.value)} className="w-full bg-white dark:bg-gray-900 px-2 py-2 rounded-lg outline-none font-black text-[9px] uppercase">
                           <option value="">-- PILIH --</option>
                           {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                     <div className="md:col-span-1 space-y-1">
                        <label className="text-[8px] font-black text-gray-400 uppercase ml-1 text-center block">Qty</label>
                        <input type="number" value={item.qty} onChange={e => updateBillItem(idx, 'qty', e.target.value)} className="w-full bg-white dark:bg-gray-900 px-1 py-2 rounded-lg outline-none font-black text-xs text-center" />
                     </div>
                     <div className="md:col-span-2 space-y-1">
                        <label className="text-[8px] font-black text-gray-400 uppercase ml-1">Harga Satuan</label>
                        <input type="text" value={item.unitPrice ? item.unitPrice.toLocaleString('id-ID') : ''} onChange={e => updateBillItem(idx, 'unitPrice', parseInt(e.target.value.replace(/[^\d]/g, '')) || 0)} className="w-full bg-white dark:bg-gray-900 px-3 py-2 rounded-lg outline-none font-black text-xs" placeholder="0" />
                     </div>
                     <div className="md:col-span-2 space-y-1">
                        <label className="text-[8px] font-black text-indigo-600 uppercase ml-1">Subtotal</label>
                        <div className="w-full bg-white dark:bg-gray-900 px-3 py-2 rounded-lg font-black text-xs text-indigo-700 overflow-hidden">{formatCurrency(item.amount)}</div>
                     </div>
                     <button type="button" onClick={() => removeBillItem(idx)} className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-gray-800 text-red-400 rounded-full border border-red-100 dark:border-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                  </div>
               ))}
            </div>
         </div>

         <div className="bg-indigo-600 text-white p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 p-8 opacity-5 -rotate-12"><Calculator size={140}/></div>
            <div className="relative z-10 text-center md:text-left mb-6 md:mb-0">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50 mb-2">Grand Total Tagihan Bruto</p>
               <h4 className="text-5xl font-black tracking-tighter">{formatCurrency(totalBillAmount)}</h4>
            </div>
            <button type="submit" className="relative z-10 px-12 py-5 bg-white text-indigo-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:bg-gray-100 active:scale-95 flex items-center gap-3"><Save size={20}/> Simpan Draf Tagihan</button>
         </div>
      </form>
    </div>
  );
};

export default BillForm;
