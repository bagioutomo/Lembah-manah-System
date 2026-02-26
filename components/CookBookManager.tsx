
import React, { useState, useMemo, useRef } from 'react';
import { 
  BookOpen, Search, Coffee, Utensils, ArrowLeft, 
  ChevronRight, Printer, ImageIcon, Loader2, Sparkles,
  Info, Scale, Clock, X, Edit3, Save,
  CheckCircle2, Square, CheckSquare, Layers, Book,
  Flame, Gauge, Users, PenTool, Lightbulb, Camera, UploadCloud,
  Cloud, HardDrive, ShieldCheck,
  AlertTriangle,
  CornerDownRight
} from 'lucide-react';
import { Recipe, ProcessedMaterial } from '../types';
import { storage } from '../services/storageService';
import html2canvas from 'html2canvas';
import CookBookPrintMode from './CookBookPrintMode';

interface Props {
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  processedMaterials: ProcessedMaterial[];
}

const CookBookManager: React.FC<Props> = ({ recipes, setRecipes, processedMaterials }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPrintMode, setShowPrintMode] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Recipe>>({});

  const businessInfo = useMemo(() => storage.getBusinessInfo(), []);

  const isDriveConfigured = useMemo(() => {
    return !!(businessInfo.gdriveJsonUrl && businessInfo.gdriveJsonUrl.includes("/exec"));
  }, [businessInfo]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    recipes.forEach(r => cats.add(r.category));
    return Array.from(cats).sort();
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const matchSearch = r.menuName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = activeCategory === 'ALL' || r.category === activeCategory;
      return matchSearch && matchCat;
    }).sort((a, b) => a.menuName.localeCompare(b.menuName));
  }, [recipes, searchTerm, activeCategory]);

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleOpenDetail = (recipe: Recipe) => {
    setViewingRecipe(recipe);
    setEditData({
      instructions: recipe.instructions || '',
      preparation: recipe.preparation || '',
      notes: recipe.notes || '',
      servings: recipe.servings || 4,
      cookTime: recipe.cookTime || '15',
      difficulty: recipe.difficulty || '3/10',
      method: recipe.method || 'BOIL',
      imageUrl: recipe.imageUrl || ''
    });
    setIsEditing(false);
  };

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1200;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject("Canvas fail");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/webp', 0.7); 
          resolve(compressedBase64.split(',')[1]);
        };
      };
      reader.onerror = (e) => reject(e);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      const base64Data = await resizeImage(file);
      const fileName = `RESEP_${viewingRecipe?.menuName.replace(/\s+/g, '_')}`;
      
      const fileId = await storage.uploadImageToDrive(base64Data, fileName);
      
      if (fileId) {
        setEditData(prev => ({ ...prev, imageUrl: fileId }));
        // Langsung update ke resep utama agar tidak hilang saat modal ditutup
        if (viewingRecipe) {
           const updatedRecipe = { ...viewingRecipe, imageUrl: fileId };
           setRecipes(prev => prev.map(r => r.id === viewingRecipe.id ? updatedRecipe : r));
           setViewingRecipe(updatedRecipe);
        }
        alert('Foto tersimpan di Drive!');
      } else {
        alert('Gagal unggah. Periksa URL Bridge Bapak.');
      }
    } catch (err) {
      alert('Error saat proses gambar.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveRecipeDetails = () => {
    if (!viewingRecipe) return;
    const updatedRecipe = { ...viewingRecipe, ...editData };
    setRecipes(prev => prev.map(r => r.id === viewingRecipe.id ? updatedRecipe : r));
    setViewingRecipe(updatedRecipe);
    setIsEditing(false);
    alert('Resep diperbarui!');
  };

  const handleExportJPG = async () => {
    const el = document.getElementById('cookbook-recipe-card');
    if (!el) return;
    try {
      setIsCapturing(true);
      await new Promise(r => setTimeout(r, 1000));
      const canvas = await html2canvas(el, { 
        scale: 2.5, 
        useCORS: true, 
        allowTaint: false,
        backgroundColor: '#ffffff' 
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.download = `RECIPE_${viewingRecipe?.menuName.replace(/\s+/g, '_')}.jpg`;
      link.click();
    } finally {
      setIsCapturing(false);
    }
  };

  const getDriveImageUrl = (id: string) => {
    if (!id || id === "") return null;
    return `https://lh3.googleusercontent.com/d/${id}`;
  };

  const selectedRecipesData = useMemo(() => recipes.filter(r => selectedIds.includes(r.id)), [recipes, selectedIds]);

  if (showPrintMode) {
    return (
      <CookBookPrintMode 
        selectedRecipes={selectedRecipesData} 
        businessInfo={businessInfo} 
        processedMaterials={processedMaterials}
        onClose={() => setShowPrintMode(false)}
        isCapturing={isCapturing}
        onExportImage={async () => {
          const el = document.getElementById('cookbook-full-print');
          if (!el) return;
          try {
            setIsCapturing(true);
            await new Promise(r => setTimeout(r, 1500));
            const canvas = await html2canvas(el, { 
              scale: 2, 
              useCORS: true, 
              allowTaint: false,
              backgroundColor: '#ffffff' 
            });
            const link = document.createElement('a');
            link.href = canvas.toDataURL("image/jpeg", 0.85);
            link.download = `Cookbook_Complete.jpg`;
            link.click();
          } finally { setIsCapturing(false); }
        }}
      />
    );
  }

  return (
    <div className="animate-fade-in space-y-10 pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-gray-950 text-white rounded-[2rem] shadow-2xl ring-4 ring-gray-200">
            <BookOpen size={36} />
          </div>
          <div>
            <div className="flex items-center gap-3">
               <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none" style={{ fontFamily: 'serif' }}>Master Recipe Vault</h2>
               {isDriveConfigured && (
                 <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-800 animate-fade-in shadow-sm">
                    <Cloud size={12} className="animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Hybrid G-Drive Connected</span>
                 </div>
               )}
            </div>
            <p className="text-sm text-gray-400 font-medium italic mt-2">Arsip standarisasi rasa & SOP rahasia {businessInfo.name}.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          {selectedIds.length > 0 && (
            <button onClick={() => setShowPrintMode(true)} className="flex-1 lg:flex-none px-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3"><Book size={18}/> Cetak Buku Koleksi ({selectedIds.length})</button>
          )}
          <button onClick={() => setSelectedIds(selectedIds.length === recipes.length ? [] : recipes.map(r => r.id))} className="px-6 py-4 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
            {selectedIds.length === recipes.length ? <CheckSquare size={16}/> : <Square size={16}/>}
            {selectedIds.length === recipes.length ? 'Batal Semua' : 'Pilih Semua'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl space-y-6 no-print">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Cari resep rahasia..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-gray-900 rounded-3xl pl-14 pr-6 py-5 outline-none font-bold text-sm transition-all shadow-inner uppercase" /></div>
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-x-auto no-scrollbar max-w-full">
             <button onClick={() => setActiveCategory('ALL')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === 'ALL' ? 'bg-white dark:bg-gray-900 text-gray-900 shadow-md' : 'text-gray-400'}`}>Semua</button>
             {categories.map(cat => (
               <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-white dark:bg-gray-900 text-gray-900 shadow-md' : 'text-gray-400'}`}>{cat}</button>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
         {filteredRecipes.length === 0 ? (
           <div className="col-span-full py-40 text-center border-4 border-dashed rounded-[4rem] opacity-20 italic font-black uppercase tracking-[0.5em] text-xs">Kosong</div>
         ) : (
           filteredRecipes.map(recipe => (
             <div key={recipe.id} onClick={() => handleOpenDetail(recipe)} className={`bg-white dark:bg-gray-900 rounded-[2.5rem] border-2 transition-all duration-500 group hover:shadow-2xl overflow-hidden relative cursor-pointer flex flex-col ${selectedIds.includes(recipe.id) ? 'border-gray-900 ring-2 ring-gray-100' : 'border-gray-100 dark:border-gray-800'}`}>
                <div className="h-56 bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
                   {recipe.imageUrl ? (
                     <img 
                       src={getDriveImageUrl(recipe.imageUrl)!} 
                       className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                       alt={recipe.menuName} 
                       crossOrigin="anonymous"
                     />
                   ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                        {recipe.category === 'FOOD' ? <Utensils size={48}/> : <Coffee size={48}/>}
                        <span className="text-[8px] font-black tracking-widest uppercase">No Image Preview</span>
                     </div>
                   )}
                   <div className="absolute top-4 left-4 p-2.5 bg-white/90 backdrop-blur rounded-xl text-gray-900 shadow-lg">{recipe.category === 'FOOD' ? <Utensils size={16}/> : <Coffee size={16}/>}</div>
                   <button onClick={(e) => handleToggleSelect(recipe.id, e)} className={`absolute top-4 right-4 p-2 rounded-xl transition-all shadow-lg z-20 ${selectedIds.includes(recipe.id) ? 'bg-gray-900 text-white' : 'bg-white/80 text-gray-300 opacity-0 group-hover:opacity-100'}`}>{selectedIds.includes(recipe.id) ? <CheckSquare size={18}/> : <Square size={18}/>}</button>
                </div>
                <div className="p-8 pb-4">
                   <h3 className="text-xl font-black uppercase tracking-tighter group-hover:text-indigo-600 transition-colors line-clamp-1 mb-2" style={{ fontFamily: 'serif' }}>{recipe.menuName}</h3>
                   <div className="flex items-center gap-2 mb-6"><span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded text-[7px] font-black uppercase tracking-widest">{recipe.subCategory}</span><span className="w-1 h-1 rounded-full bg-gray-200"></span><span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{recipe.items.length} Bahan Komposisi</span></div>
                   <div className="grid grid-cols-4 gap-2 pt-6 border-t dark:border-gray-800 opacity-60 group-hover:opacity-100 transition-all"><div className="flex flex-col items-center gap-1.5" title="Servings (Porsi)"><Users size={12} className="text-gray-400 group-hover:text-blue-500 transition-colors" /><span className="text-[7px] font-black text-gray-500 uppercase">{recipe.servings || 4}P</span></div><div className="flex flex-col items-center gap-1.5 border-x dark:border-gray-800" title="Method (Metode)"><Flame size={12} className="text-gray-400 group-hover:text-orange-500 transition-colors" /><span className="text-[7px] font-black text-gray-500 uppercase truncate w-full text-center px-1">{recipe.method || 'BOIL'}</span></div><div className="flex flex-col items-center gap-1.5" title="Cook Time (Waktu)"><Clock size={12} className="text-gray-400 group-hover:text-emerald-500 transition-colors" /><span className="text-[7px] font-black text-gray-500 uppercase">{recipe.cookTime || '15'}'</span></div><div className="flex flex-col items-center gap-1.5 border-l dark:border-gray-800" title="Difficulty (Tingkat Kesulitan)"><Gauge size={12} className="text-gray-400 group-hover:text-rose-500 transition-colors" /><span className="text-[7px] font-black text-gray-500 uppercase">{recipe.difficulty?.split('/')[0] || '3'}L</span></div></div>
                </div>
                <div className="p-8 pt-4 mt-auto"><button className="w-full py-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-all flex items-center justify-center gap-2">LIHAT NASKAH <ChevronRight size={14}/></button></div>
             </div>
           ))
         )}
      </div>

      {viewingRecipe && (
        <div className="fixed inset-0 z-[250] flex justify-center items-start px-4 animate-fade-in no-print overflow-y-auto py-10">
           <div className="fixed inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setViewingRecipe(null)} />
           <div className="relative w-full max-w-6xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl overflow-hidden animate-scale-in flex flex-col">
              <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-950 shrink-0 relative z-20">
                 <button onClick={() => setViewingRecipe(null)} className="flex items-center gap-2 text-gray-400 hover:text-black font-black text-xs uppercase tracking-widest transition-all"><ArrowLeft size={18}/> Tutup</button>
                 <div className="flex gap-3">
                    {isEditing ? (
                      <button onClick={handleSaveRecipeDetails} className="px-8 py-3 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all"><Save size={16}/> SIMPAN</button>
                    ) : (
                      <button onClick={() => setIsEditing(true)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 flex items-center gap-2"><Edit3 size={16}/> EDIT</button>
                    )}
                    <button onClick={handleExportJPG} className="p-3 bg-gray-100 rounded-xl text-gray-400 hover:text-black"><ImageIcon size={20}/></button>
                    <button onClick={() => window.print()} className="p-3 bg-gray-100 rounded-xl text-gray-400 hover:text-black"><Printer size={20}/></button>
                 </div>
              </div>

              <div id="cookbook-recipe-card" className="bg-white p-12 sm:p-20 text-black relative mx-auto print:p-0 print:border-none" style={{ width: '210mm', minHeight: '297mm' }}>
                 <div className="text-center mb-2"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em]">{viewingRecipe.category}</span></div>
                 <div className="text-center mb-8"><h1 className="text-5xl font-black uppercase tracking-tighter leading-none" style={{ fontFamily: 'serif', letterSpacing: '-0.02em' }}>{viewingRecipe.menuName}</h1></div>
                 
                 <div className="mb-10 relative h-[400px] rounded-[2.5rem] overflow-hidden bg-gray-50 border group">
                   {editData.imageUrl ? (
                     <img 
                       src={getDriveImageUrl(editData.imageUrl)!} 
                       className="w-full h-full object-cover" 
                       alt="Recipe Hero" 
                       crossOrigin="anonymous"
                     />
                   ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-4">
                        <Camera size={64} strokeWidth={1}/>
                        <p className="text-xs font-black uppercase tracking-[0.4em]">Belum Ada Foto Produk</p>
                     </div>
                   )}
                   {isEditing && (
                     <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading || !isDriveConfigured} className="px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl active:scale-95 transition-all">
                           {isUploading ? <Loader2 size={18} className="animate-spin"/> : <UploadCloud size={18}/>}
                           {isUploading ? 'SEDANG MENGUNGGAH...' : 'GANTI FOTO PRODUK'}
                        </button>
                     </div>
                   )}
                 </div>

                 <div className="grid grid-cols-4 gap-4 mb-10 border-y border-gray-100 py-8"><div className="flex flex-col items-center gap-3"><Users size={28} strokeWidth={1} className="text-gray-400" /><div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Porsi</p>{isEditing ? <input type="number" value={editData.servings} onChange={e => setEditData({...editData, servings: parseInt(e.target.value)})} className="w-12 text-center border-b border-gray-300 font-bold" /> : <p className="text-sm font-black text-gray-700">{viewingRecipe.servings || 4}</p>}</div></div><div className="flex flex-col items-center gap-3 border-x border-gray-50"><Flame size={28} strokeWidth={1} className="text-gray-400" /><div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Metode</p>{isEditing ? <input value={editData.method} onChange={e => setEditData({...editData, method: e.target.value.toUpperCase()})} className="w-20 text-center border-b border-gray-300 font-bold uppercase" /> : <p className="text-sm font-black text-gray-700">{viewingRecipe.method || 'BOIL'}</p>}</div></div><div className="flex flex-col items-center gap-3"><Clock size={28} strokeWidth={1} className="text-gray-400" /><div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Waktu (Mnt)</p>{isEditing ? <input value={editData.cookTime} onChange={e => setEditData({...editData, cookTime: e.target.value})} className="w-12 text-center border-b border-gray-300 font-bold" /> : <p className="text-sm font-black text-gray-700">{viewingRecipe.cookTime || '15'}</p>}</div></div><div className="flex flex-col items-center gap-3 border-l border-gray-50"><Gauge size={28} strokeWidth={1} className="text-gray-400" /><div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Kesulitan</p>{isEditing ? <input value={editData.difficulty} onChange={e => setEditData({...editData, difficulty: e.target.value})} className="w-20 text-center border-b border-gray-300 font-bold" /> : <p className="text-sm font-black text-gray-700">{viewingRecipe.difficulty || '3/10'}</p>}</div></div></div>

                 <div className="grid grid-cols-12 gap-12">
                    <div className="col-span-4 space-y-10">
                       <div className="p-4 bg-gray-50 rounded-2xl">
                          <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-4 pb-2 border-b border-gray-200">Ingredients</h4>
                          <div className="space-y-3">
                             {viewingRecipe.items.map((it, idx) => {
                                const procMat = processedMaterials?.find(m => m.id === it.articleId || m.name.toUpperCase() === it.name.toUpperCase());
                                return (
                                   <div key={idx} className="flex flex-col">
                                      <div className="flex justify-between items-start border-b border-gray-200/50 pb-1 group/ing gap-2">
                                         <span className="text-[8.5pt] font-black text-gray-800 uppercase flex-1 leading-tight whitespace-normal break-words">{it.name}</span>
                                         <span className="text-[8pt] font-bold text-gray-400 shrink-0 italic leading-tight">{it.quantity}{it.unit.toLowerCase()}</span>
                                      </div>
                                      {procMat && procMat.items && (
                                         <div className="ml-1 pl-2 border-l border-amber-200 mb-1 mt-1 space-y-1">
                                            {procMat.items.map((sub, sIdx) => {
                                               const scaleFactor = it.quantity / (procMat.yieldQuantity || 1);
                                               const scaledQty = sub.quantity * scaleFactor;
                                               return (
                                                  <div key={sIdx} className="flex justify-between items-center gap-2 opacity-60">
                                                     <span className="text-[6.5pt] font-bold text-gray-500 leading-none uppercase flex-1 whitespace-normal break-words">{sub.name}</span>
                                                     <span className="text-[6pt] font-medium text-gray-400 shrink-0 italic">
                                                        {scaledQty.toFixed(scaledQty < 1 ? 2 : 1)}{sub.unit.toLowerCase()}
                                                     </span>
                                                  </div>
                                               );
                                            })}
                                         </div>
                                      )}
                                   </div>
                                );
                             })}
                          </div>
                       </div>
                       <div className="space-y-3">
                          <h4 className="text-[9px] font-black uppercase tracking-[0.2em] border-b-2 border-black w-fit flex items-center gap-1.5"><Lightbulb size={12} className="text-amber-500"/> Chef's Notes</h4>
                          {isEditing ? <textarea value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} className="w-full h-32 p-4 bg-gray-50 border-none rounded-xl font-medium text-[9pt] leading-relaxed outline-none" placeholder="Tips rahasia..." /> : <p className="text-[8.5pt] leading-[1.5] text-gray-500 font-medium italic">{viewingRecipe.notes || 'Tidak ada catatan khusus.'}</p>}
                       </div>
                    </div>

                    <div className="col-span-8 space-y-10">
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] pb-1 border-b-2 border-black w-fit flex items-center gap-2"><PenTool size={14}/> Persiapan Awal</h4>
                          {isEditing ? <textarea value={editData.preparation} onChange={e => setEditData({...editData, preparation: e.target.value})} className="w-full h-32 p-4 bg-gray-50 border-none rounded-xl font-medium text-[10pt] leading-relaxed outline-none" placeholder="Langkah persiapan awal..." /> : <div className="text-[10pt] leading-[1.8] text-gray-600 font-medium whitespace-pre-line">{viewingRecipe.preparation || 'Langkah persiapan belum diisi.'}</div>}
                       </div>
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] pb-1 border-b-2 border-black w-fit flex items-center gap-2"><Utensils size={14}/> Instruksi Memasak</h4>
                          {isEditing ? <textarea value={editData.instructions} onChange={e => setEditData({...editData, instructions: e.target.value})} className="w-full h-[400px] p-4 bg-gray-50 border-none rounded-xl font-medium text-[10pt] leading-relaxed outline-none" placeholder="Langkah masak utama..." /> : <div className="text-[10pt] leading-[2.2] text-gray-800 font-medium whitespace-pre-line text-justify">{viewingRecipe.instructions || 'Instruksi belum tersedia.'}</div>}
                       </div>
                    </div>
                 </div>

                 <div className="absolute bottom-12 left-0 w-full text-center"><div className="w-32 h-px bg-gray-100 mx-auto mb-4"></div><p className="text-[7pt] font-black text-gray-300 uppercase tracking-[0.6em]">{businessInfo.name} STANDARIZATION PROTOCOL</p></div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CookBookManager;
