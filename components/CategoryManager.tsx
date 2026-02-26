
import React, { useState } from 'react';
import { 
  Tag, Plus, Edit2, Trash2, Save, AlertTriangle, X, Info, 
  Truck, Check, Activity, ShieldAlert, Search, LayoutGrid, 
  Settings2, Smartphone, Building2, ChevronDown
} from 'lucide-react';
import { Supplier, CategoryConfig, UserRole } from '../types';

interface Props {
  categories: CategoryConfig[];
  setCategories: React.Dispatch<React.SetStateAction<CategoryConfig[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  userRole?: UserRole;
}

const CategoryManager: React.FC<Props> = ({ categories, setCategories, suppliers, setSuppliers, userRole }) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'suppliers'>('categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [isNewOp, setIsNewOp] = useState(true);
  const [editingCat, setEditingCat] = useState<{index: number, name: string, isOperational: boolean} | null>(null);
  
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '' });
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddCat = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim().toUpperCase();
    if (!name) return;
    if (categories.find(c => c.name.toUpperCase() === name)) return alert('Kategori sudah ada');
    
    setCategories(prev => [...prev, { name, isOperational: isNewOp }]);
    setNewCatName('');
    setIsNewOp(true);
    setShowAddForm(false);
  };

  const handleUpdateCat = () => {
    if (!editingCat) return;
    const newName = editingCat.name.trim().toUpperCase();
    if (!newName) return;

    setCategories(prev => {
      const updated = [...prev];
      updated[editingCat.index] = { name: newName, isOperational: editingCat.isOperational };
      return updated;
    });
    setEditingCat(null);
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name.trim()) return;
    const supplier: Supplier = {
      id: `sup-${Date.now()}`,
      name: newSupplier.name.trim().toUpperCase(),
      phone: newSupplier.phone
    };
    setSuppliers(prev => [...prev, supplier]);
    setNewSupplier({ name: '', phone: '' });
    setShowAddForm(false);
  };

  const handleUpdateSupplier = () => {
    if (!editingSupplier) return;
    setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? editingSupplier : s));
    setEditingSupplier(null);
  };

  const deleteCategory = (name: string) => {
    if (confirm(`Hapus kategori "${name}"? Seluruh record dengan kategori ini di database tidak akan terhapus, namun tidak bisa dipilih lagi.`)) {
      setCategories(prev => prev.filter(c => c.name !== name));
    }
  };

  const deleteSupplier = (id: string) => {
    if (confirm(`Hapus suplier ini?`)) {
      setSuppliers(prev => prev.filter(s => s.id !== id));
    }
  };

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="animate-fade-in space-y-10 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className={`p-4 ${activeTab === 'categories' ? 'bg-indigo-600' : 'bg-emerald-600'} text-white rounded-[1.5rem] shadow-xl`}>
            {activeTab === 'categories' ? <Tag size={28} /> : <Truck size={28} />}
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tighter">
              {activeTab === 'categories' ? 'Master Kategori Biaya' : 'Master Suplier Vendor'}
            </h2>
            <p className="text-sm text-gray-500 font-medium italic">Atur klasifikasi finansial dan rekanan suplier Lembah Manah.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
           <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border dark:border-gray-700 w-fit">
              <button onClick={() => setActiveTab('categories')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'categories' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-md' : 'text-gray-400'}`}>Kategori</button>
              <button onClick={() => setActiveTab('suppliers')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'suppliers' ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-md' : 'text-gray-400'}`}>Suplier</button>
           </div>
           <button onClick={() => setShowAddForm(true)} className={`px-8 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer ${activeTab === 'categories' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              <Plus size={18}/> {activeTab === 'categories' ? 'Kategori Baru' : 'Suplier Baru'}
           </button>
        </div>
      </div>

      <div className="relative max-w-md w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" placeholder={`Cari di ${activeTab === 'categories' ? 'kategori' : 'suplier'}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl pl-12 pr-6 py-3 outline-none font-bold text-sm shadow-sm transition-all focus:border-indigo-500" />
      </div>

      {activeTab === 'categories' ? (
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden animate-fade-in">
           <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border-b dark:border-gray-800 flex gap-4 items-center">
              <Info size={24} className="text-blue-600 shrink-0" />
              <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase leading-relaxed italic">
                 <b>Operasional</b>: Memotong Laba Harian (Belanja Bahan, Gaji, Listrik). <br/>
                 <b>Non-Operasional</b>: Alokasi dari Laba (Investasi Alat, Prive Owner, Cicilan Modal).
              </p>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                   <th className="px-8 py-5">Nama Kategori</th>
                   <th className="px-6 py-5">Status Perhitungan</th>
                   <th className="px-8 py-5 text-center">Tindakan</th>
                 </tr>
               </thead>
               <tbody className="divide-y dark:divide-gray-800">
                 {filteredCategories.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                       <td className="px-8 py-6">
                          {editingCat?.index === idx ? (
                             <input value={editingCat.name} onChange={e => setEditingCat({...editingCat, name: e.target.value.toUpperCase()})} className="bg-white dark:bg-gray-800 border-2 border-indigo-600 rounded-lg px-3 py-1 text-sm font-black uppercase outline-none" />
                          ) : (
                             <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{cat.name}</p>
                          )}
                       </td>
                       <td className="px-6 py-6">
                          {editingCat?.index === idx ? (
                             <div className="flex items-center gap-4">
                                <button onClick={() => setEditingCat({...editingCat, isOperational: true})} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${editingCat.isOperational ? 'bg-green-600 text-white border-green-600' : 'text-gray-400'}`}>Operasional</button>
                                <button onClick={() => setEditingCat({...editingCat, isOperational: false})} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${!editingCat.isOperational ? 'bg-orange-600 text-white border-orange-600' : 'text-gray-400'}`}>Non-Op</button>
                             </div>
                          ) : (
                             <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-fit ${cat.isOperational ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {cat.isOperational ? <><Activity size={10}/> Operasional</> : <><ShieldAlert size={10}/> Non-Operasional</>}
                             </span>
                          )}
                       </td>
                       <td className="px-8 py-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                             {editingCat?.index === idx ? (
                                <>
                                  <button onClick={handleUpdateCat} className="p-2 text-green-600 bg-green-50 rounded-xl"><Check size={18}/></button>
                                  <button onClick={() => setEditingCat(null)} className="p-2 text-red-600 bg-red-50 rounded-xl"><X size={18}/></button>
                                </>
                             ) : (
                                <>
                                  <button onClick={() => setEditingCat({index: idx, name: cat.name, isOperational: cat.isOperational})} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"><Edit2 size={18}/></button>
                                  <button onClick={() => deleteCategory(cat.name)} className="p-2 text-red-300 hover:text-red-500 rounded-xl transition-all cursor-pointer"><Trash2 size={18}/></button>
                                </>
                             )}
                          </div>
                       </td>
                    </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden animate-fade-in">
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                   <th className="px-8 py-5">Nama Suplier / Vendor</th>
                   <th className="px-6 py-5">Kontak Utama</th>
                   <th className="px-8 py-5 text-center">Tindakan</th>
                 </tr>
               </thead>
               <tbody className="divide-y dark:divide-gray-800">
                 {filteredSuppliers.map((sup, idx) => (
                    <tr key={sup.id} className="hover:bg-gray-50/50 transition-colors group">
                       <td className="px-8 py-6">
                          {editingSupplier?.id === sup.id ? (
                             <input value={editingSupplier.name} onChange={e => setEditingSupplier({...editingSupplier, name: e.target.value.toUpperCase()})} className="bg-white dark:bg-gray-800 border-2 border-emerald-600 rounded-lg px-3 py-1 text-sm font-black uppercase outline-none" />
                          ) : (
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center font-black">{sup.name.charAt(0)}</div>
                                <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{sup.name}</p>
                             </div>
                          )}
                       </td>
                       <td className="px-6 py-6">
                          {editingSupplier?.id === sup.id ? (
                             <input value={editingSupplier.phone} onChange={e => setEditingSupplier({...editingSupplier, phone: e.target.value})} className="bg-white dark:bg-gray-800 border-2 border-emerald-600 rounded-lg px-3 py-1 text-sm font-black outline-none" />
                          ) : (
                             <p className="text-sm font-bold text-gray-400 flex items-center gap-2"><Smartphone size={14}/> {sup.phone || '-'}</p>
                          )}
                       </td>
                       <td className="px-8 py-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                             {editingSupplier?.id === sup.id ? (
                                <>
                                  <button onClick={handleUpdateSupplier} className="p-2 text-green-600 bg-green-50 rounded-xl"><Check size={18}/></button>
                                  <button onClick={() => setEditingSupplier(null)} className="p-2 text-red-600 bg-red-50 rounded-xl"><X size={18}/></button>
                                </>
                             ) : (
                                <>
                                  <button onClick={() => setEditingSupplier(sup)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"><Edit2 size={18}/></button>
                                  <button onClick={() => deleteSupplier(sup.id)} className="p-2 text-red-300 hover:text-red-500 rounded-xl transition-all cursor-pointer"><Trash2 size={18}/></button>
                                </>
                             )}
                          </div>
                       </td>
                    </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* FORM MODAL ADD MASTER */}
      {showAddForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 animate-fade-in no-print">
           <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowAddForm(false)} />
           <div className={`relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-[3rem] p-10 shadow-2xl animate-scale-in border-t-8 ${activeTab === 'categories' ? 'border-indigo-600' : 'border-emerald-600'}`}>
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-black uppercase tracking-tighter">Tambah {activeTab === 'categories' ? 'Kategori' : 'Suplier'} Baru</h3>
                 <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"><X size={28}/></button>
              </div>

              {activeTab === 'categories' ? (
                <form onSubmit={handleAddCat} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Nama Kategori</label>
                      <input required autoFocus value={newCatName} onChange={e => setNewCatName(e.target.value.toUpperCase())} placeholder="CONTOH: BIAYA PERALATAN..." className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-4 outline-none font-black text-sm uppercase" />
                   </div>
                   <div className="space-y-4 pt-4 border-t dark:border-gray-800">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Sifat Perhitungan</label>
                      <div className="grid grid-cols-2 gap-4">
                         <button type="button" onClick={() => setIsNewOp(true)} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center gap-3 ${isNewOp ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-600 text-indigo-600 shadow-lg' : 'bg-gray-50 dark:bg-gray-800 border-transparent text-gray-300'}`}>
                            <Activity size={24}/>
                            <span className="text-[10px] font-black uppercase">Operasional</span>
                         </button>
                         <button type="button" onClick={() => setIsNewOp(false)} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center gap-3 ${!isNewOp ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-600 text-orange-600 shadow-lg' : 'bg-gray-50 dark:bg-gray-800 border-transparent text-gray-300'}`}>
                            <ShieldAlert size={24}/>
                            <span className="text-[10px] font-black uppercase">Non-Op</span>
                         </button>
                      </div>
                   </div>
                   <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl mt-4">Daftarkan Kategori</button>
                </form>
              ) : (
                <form onSubmit={handleAddSupplier} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3 flex items-center gap-2"><Building2 size={12}/> Nama Vendor / Toko</label>
                      <input required autoFocus value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value.toUpperCase()})} placeholder="CONTOH: UD KOPI MANAH..." className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-600 rounded-2xl px-6 py-4 outline-none font-black text-sm uppercase" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3 flex items-center gap-2"><Smartphone size={12}/> Nomor HP / WhatsApp</label>
                      <input required type="tel" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} placeholder="08XXXXXXXXX" className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-600 rounded-2xl px-6 py-4 outline-none font-black text-sm" />
                   </div>
                   <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl mt-4">Daftarkan Suplier</button>
                </form>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
