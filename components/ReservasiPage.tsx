
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Ticket, Plus, Search, Calendar, Clock, Users, MessageCircle, 
  CheckCircle2, Trash2, Edit3, X, Save, MapPin, ChevronRight,
  ChevronDown, History, Check, Coins, Utensils, FolderTree,
  ImageIcon, Loader2, Printer, ShieldCheck, Building2, Download,
  FileText, User, Hash, Phone, AlertCircle, Smartphone, Tag,
  Briefcase, Settings, Coffee, CupSoda, Receipt, ExternalLink,
  Landmark, CreditCard, Zap, Layers, ChefHat, Info, Filter,
  ArrowRight, Sparkles, ChefHatIcon, Soup, FileEdit, Leaf,
  CheckSquare, Square, UserPlus, Coins as CoinsIcon, ClipboardList,
  PlusCircle, MinusCircle, ListFilter, LayoutGrid, Package, ArrowUpRight,
  Calculator, UserPlus2, UserMinus,
  CheckSquare2,
  ListRestart,
  Share2,
  Send,
  FileCheck
} from 'lucide-react';
import { Reservation, ReservationPaymentConfig, MenuPackage, AdditionalCharge, PaxOrder, Recipe } from '../types';
import { storage } from '../services/storageService';
import html2canvas from 'html2canvas';

interface Props {
  reservations: Reservation[];
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  areas: string[];
  setAreas: React.Dispatch<React.SetStateAction<string[]>>;
  reservationCategories: string[];
  setReservationCategories: React.Dispatch<React.SetStateAction<string[]>>;
  serviceTypes: string[];
  setServiceTypes: React.Dispatch<React.SetStateAction<string[]>>;
  recipes: Recipe[];
  // Synced Props
  menuPackages: MenuPackage[];
  setMenuPackages: React.Dispatch<React.SetStateAction<MenuPackage[]>>;
  additionalCharges: AdditionalCharge[];
  setAdditionalCharges: React.Dispatch<React.SetStateAction<AdditionalCharge[]>>;
  paymentConfig: ReservationPaymentConfig;
  setPaymentConfig: React.Dispatch<React.SetStateAction<ReservationPaymentConfig>>;
}

const ReservasiPage: React.FC<Props> = ({ 
  reservations, 
  setReservations, 
  areas, 
  setAreas,
  reservationCategories,
  setReservationCategories,
  serviceTypes,
  setServiceTypes,
  recipes,
  menuPackages,
  setMenuPackages,
  additionalCharges,
  setAdditionalCharges,
  paymentConfig,
  setPaymentConfig
}) => {
  const [activeViewTab, setActiveViewTab] = useState<'RESERVATIONS' | 'PACKAGES'>('RESERVATIONS');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [masterTab, setMasterTab] = useState<'AREA' | 'CATEGORY' | 'SERVICE_TYPE' | 'PAYMENT' | 'ADDITIONAL'>('AREA');
  const [newMasterName, setNewMasterName] = useState('');
  const [newMasterPrice, setNewMasterPrice] = useState(0);
  
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);
  const [editingPackage, setEditingPackage] = useState<MenuPackage | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<Reservation | null>(null);
  const [printingOpSlip, setPrintingOpSlip] = useState<Reservation | null>(null);
  
  // Penawaran Multi-Paket
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [showQuotationPreview, setShowQuotationPreview] = useState(false);
  const [quotationCustomer, setQuotationCustomer] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  // State untuk Menu Picker
  const [showMenuPicker, setShowMenuPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<{ 
    target: 'GLOBAL_FOOD' | 'GLOBAL_BEV' | 'PAX_FOOD' | 'PAX_DRINK' | 'PKG_FOOD' | 'PKG_BEV', 
    cat: 'FOOD' | 'BEVERAGE',
    paxIndex?: number
  }>({ target: 'GLOBAL_FOOD', cat: 'FOOD' });
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  
  const businessInfo = useMemo(() => storage.getBusinessInfo(), []);
  
  const safeServiceTypes = useMemo(() => Array.isArray(serviceTypes) ? serviceTypes : [], [serviceTypes]);
  const safeAreas = useMemo(() => Array.isArray(areas) ? areas : [], [areas]);
  const safeReservationCategories = useMemo(() => Array.isArray(reservationCategories) ? reservationCategories : [], [reservationCategories]);

  const [formData, setFormData] = useState<Partial<Reservation>>({
    customerName: '', phone: '', date: new Date().toISOString().split('T')[0],
    time: '12:00', guests: 1, area: safeAreas[0] || 'INDOOR', category: safeReservationCategories[0] || 'MAKAN SIANG',
    serviceType: safeServiceTypes[0] || 'BUFFET',
    dpAmount: 0, foodSelection: '', beverageSelection: '', packageName: '', snackSelection: '',
    dessertSelection: '', additionalChargeItems: '', additionalChargePrice: 0, pricePerPax: 0, status: 'PENDING', notes: '',
    paxOrders: []
  });

  const [packageFormData, setPackageFormData] = useState<Partial<MenuPackage>>({
    name: '', category: safeServiceTypes[0] || 'BUFFET', foodItems: '', beverageItems: '', snackItems: '', dessertItems: '',
    pricePerPax: 0
  });

  const filteredReservations = useMemo(() => {
    return (reservations || []).filter(r => 
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.phone && r.phone.includes(searchTerm))
    ).sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
  }, [reservations, searchTerm]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => 
      r.category === pickerMode.cat && 
      r.menuName.toLowerCase().includes(menuSearchTerm.toLowerCase())
    );
  }, [recipes, pickerMode, menuSearchTerm]);

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageFormData.name) return alert('Nama paket wajib diisi!');
    const newPkg: MenuPackage = {
      id: editingPackage?.id || `pkg-${Date.now()}`,
      name: packageFormData.name.toUpperCase(),
      category: packageFormData.category || safeServiceTypes[0] || 'BUFFET',
      foodItems: packageFormData.foodItems || '',
      beverageItems: packageFormData.beverageItems || '',
      snackItems: packageFormData.snackItems || '',
      dessertItems: packageFormData.dessertItems || '',
      additionalCharges: packageFormData.additionalCharges || '',
      pricePerPax: Number(packageFormData.pricePerPax) || 0,
      timestamp: new Date().toISOString()
    };
    setMenuPackages(prev => {
      const current = Array.isArray(prev) ? prev : [];
      return editingPackage ? current.map(p => p.id === editingPackage.id ? newPkg : p) : [...current, newPkg];
    });
    setShowPackageForm(false);
    setEditingPackage(null);
  };

  const handleApplyPackage = (pkg: MenuPackage) => {
    setFormData({
      ...formData,
      packageName: pkg.name,
      serviceType: pkg.category || 'BUFFET',
      foodSelection: pkg.foodItems,
      beverageSelection: pkg.beverageItems,
      snackSelection: pkg.snackItems,
      dessertSelection: pkg.dessertItems,
      pricePerPax: pkg.pricePerPax
    });
    setActiveViewTab('RESERVATIONS');
    setShowForm(true);
    setEditingRes(null);
  };

  const handleServiceTypeChange = (newVal: string) => {
    if (newVal !== 'ALA CARTE' && newVal !== 'ALA CARTE PER PAX') {
      const matchedPkg = menuPackages.find(p => p.category === newVal);
      if (matchedPkg) {
        setFormData({
          ...formData,
          serviceType: newVal,
          packageName: matchedPkg.name,
          foodSelection: matchedPkg.foodItems,
          beverageSelection: matchedPkg.beverageItems,
          snackSelection: matchedPkg.snackItems,
          dessertSelection: matchedPkg.dessertItems,
          pricePerPax: matchedPkg.pricePerPax
        });
        return;
      }
    }
    
    setFormData({ 
      ...formData, 
      serviceType: newVal,
      packageName: '',
      foodSelection: '',
      beverageSelection: '',
      pricePerPax: 0 
    });
  };

  const handleSelectPackage = (pkgName: string) => {
    const pkg = menuPackages.find(p => p.name === pkgName);
    if (pkg) {
      setFormData({
        ...formData,
        packageName: pkg.name,
        foodSelection: pkg.foodItems,
        beverageSelection: pkg.beverageItems,
        snackSelection: pkg.snackItems,
        dessertSelection: pkg.dessertItems,
        pricePerPax: pkg.pricePerPax
      });
    }
  };

  const handleAddPaxRow = () => {
    const newPax: PaxOrder = { name: '', food: '', drink: '' };
    setFormData({ ...formData, paxOrders: [...(formData.paxOrders || []), newPax] });
  };

  const handleRemovePaxRow = (index: number) => {
    const updated = (formData.paxOrders || []).filter((_, i) => i !== index);
    setFormData({ ...formData, paxOrders: updated });
  };

  const updatePaxField = (index: number, field: keyof PaxOrder, val: string) => {
    const updated = [...(formData.paxOrders || [])];
    updated[index] = { ...updated[index], [field]: val };
    setFormData({ ...formData, paxOrders: updated });
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName) return alert('Nama tamu wajib diisi!');
    const newRes: Reservation = {
      id: editingRes?.id || `res-${Date.now()}`,
      customerName: formData.customerName.toUpperCase(),
      phone: formData.phone || '',
      date: formData.date || '',
      time: formData.time || '',
      guests: formData.guests || 1,
      area: formData.area || '',
      category: formData.category || '',
      serviceType: formData.serviceType || 'BUFFET',
      dpAmount: Number(formData.dpAmount) || 0,
      foodSelection: formData.foodSelection || '',
      beverageSelection: formData.beverageSelection || '',
      paxOrders: formData.paxOrders || [],
      packageName: formData.packageName || '',
      snackSelection: formData.snackSelection || '',
      dessertSelection: formData.dessertSelection || '',
      additionalChargeItems: formData.additionalChargeItems || '',
      additionalChargePrice: Number(formData.additionalChargePrice) || 0,
      pricePerPax: Number(formData.pricePerPax) || 0,
      status: (formData.status as any) || 'PENDING',
      notes: formData.notes || '',
      timestamp: new Date().toISOString()
    };
    setReservations(prev => {
      const current = Array.isArray(prev) ? prev : [];
      return editingRes ? current.map(r => r.id === editingRes.id ? newRes : r) : [...current, newRes];
    });
    setShowForm(false);
    setEditingRes(null);
  };

  const handleSelectMenuItem = (recipeName: string) => {
    const { target, paxIndex } = pickerMode;

    if (target === 'GLOBAL_FOOD') {
      const current = formData.foodSelection ? formData.foodSelection.split(', ') : [];
      if (!current.includes(recipeName)) setFormData({ ...formData, foodSelection: [...current, recipeName].join(', ') });
    } else if (target === 'GLOBAL_BEV') {
      const current = formData.beverageSelection ? formData.beverageSelection.split(', ') : [];
      if (!current.includes(recipeName)) setFormData({ ...formData, beverageSelection: [...current, recipeName].join(', ') });
    } else if (target === 'PKG_FOOD') {
      const current = packageFormData.foodItems ? packageFormData.foodItems.split(', ') : [];
      if (!current.includes(recipeName)) setPackageFormData({ ...packageFormData, foodItems: [...current, recipeName].join(', ') });
    } else if (target === 'PKG_BEV') {
      const current = packageFormData.beverageItems ? packageFormData.beverageItems.split(', ') : [];
      if (!current.includes(recipeName)) setPackageFormData({ ...packageFormData, beverageItems: [...current, recipeName].join(', ') });
    } else if (target === 'PAX_FOOD' && paxIndex !== undefined) {
      updatePaxField(paxIndex, 'food', recipeName);
    } else if (target === 'PAX_DRINK' && paxIndex !== undefined) {
      updatePaxField(paxIndex, 'drink', recipeName);
    }

    setShowMenuPicker(false);
    setMenuSearchTerm('');
  };

  const handleAddMaster = () => {
    const val = newMasterName.trim().toUpperCase();
    if (!val) return;

    if (masterTab === 'AREA') {
      if (safeAreas.includes(val)) return alert('Area sudah ada');
      setAreas(prev => [...prev, val]);
    } else if (masterTab === 'CATEGORY') {
      if (safeReservationCategories.includes(val)) return alert('Kategori sudah ada');
      setReservationCategories(prev => [...prev, val]);
    } else if (masterTab === 'SERVICE_TYPE') {
      if (safeServiceTypes.includes(val)) return alert('Tipe layanan sudah ada');
      setServiceTypes(prev => [...prev, val]);
    } else if (masterTab === 'ADDITIONAL') {
      if (additionalCharges.some(ac => ac.name === val)) return alert('Item sudah ada');
      const newCharge: AdditionalCharge = { id: `ac-${Date.now()}`, name: val, price: newMasterPrice };
      setAdditionalCharges(prev => [...prev, newCharge]);
    }

    setNewMasterName('');
    setNewMasterPrice(0);
  };

  const handleCaptureSlip = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    try {
      setIsCapturing(true);
      await new Promise(r => setTimeout(r, 800)); 
      const canvas = await html2canvas(element, { scale: 2.5, useCORS: true, backgroundColor: '#ffffff' });
      const image = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement('a');
      link.href = image; link.download = `${filename}.jpg`; link.click();
    } finally {
      setIsCapturing(false);
    }
  };

  const formatCurrency = (val: number) => 'Rp ' + (val || 0).toLocaleString('id-ID');
  const getIndonesianDate = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-";

  const availablePackagesForService = useMemo(() => {
    return menuPackages.filter(p => p.category === formData.serviceType);
  }, [menuPackages, formData.serviceType]);

  const togglePackageSelection = (id: string) => {
    setSelectedPackageIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const selectedPackagesData = useMemo(() => {
    return menuPackages.filter(p => selectedPackageIds.includes(p.id));
  }, [menuPackages, selectedPackageIds]);

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className={`p-4 ${activeViewTab === 'RESERVATIONS' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white rounded-[1.5rem] shadow-xl`}>
            {activeViewTab === 'RESERVATIONS' ? <Ticket size={28} /> : <Package size={28} />}
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
               {activeViewTab === 'RESERVATIONS' ? 'Manajemen Reservasi' : 'Katalog Paket Menu'}
            </h2>
            <p className="text-sm text-gray-500 font-medium italic mt-2">Atur pemesanan tamu dan paket event Lembah Manah.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
           <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border dark:border-gray-700 w-fit">
              <button onClick={() => setActiveViewTab('RESERVATIONS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${activeViewTab === 'RESERVATIONS' ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-md' : 'text-gray-400'}`}>Data Reservasi</button>
              <button onClick={() => setActiveViewTab('PACKAGES')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${activeViewTab === 'PACKAGES' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-md' : 'text-gray-400'}`}>Katalog Paket</button>
           </div>
           <button onClick={() => setShowMasterModal(true)} className="p-4 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-2xl border dark:border-gray-700 hover:text-indigo-600 transition-all shadow-sm cursor-pointer"><Settings size={20}/></button>
           <button 
             onClick={() => {
                if(activeViewTab === 'RESERVATIONS') {
                  setEditingRes(null);
                  setFormData({
                    customerName: '', phone: '', date: new Date().toISOString().split('T')[0],
                    time: '12:00', guests: 1, area: safeAreas[0] || 'INDOOR', category: safeReservationCategories[0] || 'MAKAN SIANG',
                    serviceType: safeServiceTypes[0] || 'BUFFET',
                    dpAmount: 0, foodSelection: '', beverageSelection: '', packageName: '', snackSelection: '',
                    dessertSelection: '', additionalChargeItems: '', additionalChargePrice: 0, pricePerPax: 0, status: 'PENDING', notes: '',
                    paxOrders: []
                  });
                  setShowForm(true);
                } else {
                  setEditingPackage(null);
                  setPackageFormData({ name: '', category: safeServiceTypes[0] || 'BUFFET', foodItems: '', beverageItems: '', snackItems: '', dessertItems: '', pricePerPax: 0 });
                  setShowPackageForm(true);
                }
             }} 
             className={`px-8 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer ${activeViewTab === 'RESERVATIONS' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
           >
             <Plus size={18} /> {activeViewTab === 'RESERVATIONS' ? 'Booking Baru' : 'Rancang Paket'}
           </button>
        </div>
      </div>

      {activeViewTab === 'RESERVATIONS' ? (
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden animate-fade-in">
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                   <th className="px-8 py-5">Waktu & Tamu</th>
                   <th className="px-6 py-5">Area & Tipe Layanan</th>
                   <th className="px-6 py-5 text-right">DP Dibayarkan</th>
                   <th className="px-6 py-5">Status</th>
                   <th className="px-8 py-5 text-center">Tindakan</th>
                 </tr>
               </thead>
               <tbody className="divide-y dark:divide-gray-800 text-sm">
                 {filteredReservations.length === 0 ? (
                    <tr><td colSpan={5} className="py-20 text-center text-gray-300 font-black uppercase tracking-widest italic">Belum ada reservasi</td></tr>
                 ) : (
                    filteredReservations.map(res => (
                       <tr key={res.id} className="hover:bg-gray-50/50 transition-colors group text-sm">
                          <td className="px-8 py-6">
                             <p className="font-black text-gray-900 dark:text-white uppercase leading-none mb-1">{res.customerName}</p>
                             <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                                <span>{res.date}</span><span>•</span><span>{res.time} WIB</span>
                             </div>
                          </td>
                          <td className="px-6 py-6">
                             <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                   <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-black uppercase">{res.category}</span>
                                   <span className="text-[10px] font-black uppercase flex items-center gap-1"><MapPin size={10} className="text-rose-500"/> {res.area}</span>
                                </div>
                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter italic">{res.serviceType || 'BUFFET'}</span>
                             </div>
                          </td>
                          <td className="px-6 py-6 text-right">
                             <p className="text-lg font-black text-emerald-600 tracking-tighter">{formatCurrency(res.dpAmount)}</p>
                             <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{res.guests} Pax</p>
                          </td>
                          <td className="px-6 py-6">
                             <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                               res.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 
                               res.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                               res.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                               'bg-orange-100 text-orange-700'
                             }`}>{res.status}</span>
                          </td>
                          <td className="px-8 py-6 text-center">
                             <div className="flex items-center justify-center gap-1">
                                <button onClick={() => setPrintingOpSlip(res)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl cursor-pointer" title="Work Order (Operational)"><ClipboardList size={18}/></button>
                                <button onClick={() => setPrintingInvoice(res)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl cursor-pointer" title="Kuitansi DP"><Receipt size={18}/></button>
                                <button onClick={() => { setEditingRes(res); setFormData(res); setShowForm(true); }} className="p-2 text-gray-400 hover:text-blue-600 rounded-xl cursor-pointer"><Edit3 size={18}/></button>
                                <button onClick={() => { if(window.confirm('Hapus permanen?')) setReservations(prev => prev.filter(r => r.id !== res.id)) }} className="p-2 text-red-300 hover:text-red-500 rounded-xl cursor-pointer"><Trash2 size={18}/></button>
                             </div>
                          </td>
                       </tr>
                    ))
                 )}
               </tbody>
             </table>
           </div>
        </div>
      ) : (
        <div className="space-y-10">
           {selectedPackageIds.length > 0 && (
             <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-slide-up w-full max-w-xl px-4 no-print">
                <div className="bg-indigo-900 text-white p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between border-4 border-indigo-400">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/10 rounded-2xl"><Package size={24}/></div>
                      <div>
                         <p className="text-xl font-black">{selectedPackageIds.length} Paket Dipilih</p>
                         <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest">Siap Generate Penawaran Formal</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => { setQuotationCustomer(''); setShowQuotationPreview(true); }}
                     className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                   >
                      <Share2 size={18}/> Buat Penawaran
                   </button>
                </div>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
              {menuPackages.length === 0 ? (
                 <div className="col-span-full py-32 text-center bg-white dark:bg-gray-900 border-2 border-dashed rounded-[3rem] opacity-30 italic font-black uppercase tracking-widest text-xs">Belum ada paket menu dirancang</div>
              ) : (
                 menuPackages.map(pkg => (
                    <div key={pkg.id} className={`bg-white dark:bg-gray-900 rounded-[3rem] border-4 transition-all duration-500 group hover:shadow-2xl overflow-hidden relative ${selectedPackageIds.includes(pkg.id) ? 'border-indigo-600 shadow-indigo-500/20' : 'border-gray-100 dark:border-gray-800 shadow-xl'}`}>
                       <button 
                         onClick={() => togglePackageSelection(pkg.id)}
                         className={`absolute top-6 right-6 p-3 rounded-full transition-all z-10 ${selectedPackageIds.includes(pkg.id) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-300 hover:bg-indigo-50 hover:text-indigo-600'}`}
                       >
                         {selectedPackageIds.includes(pkg.id) ? <CheckSquare2 size={24}/> : <Square size={24}/>}
                       </button>

                       <div className="p-8">
                          <div className="flex justify-between items-start mb-6">
                             <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl"><Package size={24}/></div>
                             <div className="text-right pr-10">
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[8px] font-black uppercase mb-1 inline-block">{pkg.category || 'REGULER'}</span>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Harga Per Pax</p>
                                <p className="text-xl font-black text-indigo-600">{formatCurrency(pkg.pricePerPax)}</p>
                             </div>
                          </div>
                          <h3 className="text-xl font-black uppercase tracking-tighter mb-6 line-clamp-1">{pkg.name}</h3>
                          <div className="space-y-4 mb-10">
                             <div className="flex gap-3"><Utensils size={14} className="text-orange-500 shrink-0 mt-1"/><p className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase leading-relaxed line-clamp-2">{pkg.foodItems || '-'}</p></div>
                             <div className="flex gap-3"><Coffee size={14} className="text-blue-500 shrink-0 mt-1"/><p className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase leading-relaxed line-clamp-2">{pkg.beverageItems || '-'}</p></div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 pt-6 border-t dark:border-gray-800">
                             <button onClick={() => handleApplyPackage(pkg)} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all cursor-pointer"><Zap size={14}/> Gunakan</button>
                             <div className="flex gap-2">
                                <button onClick={() => { setEditingPackage(pkg); setPackageFormData(pkg); setShowPackageForm(true); }} className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-indigo-600 rounded-xl transition-all cursor-pointer flex items-center justify-center"><Edit3 size={16}/></button>
                                <button onClick={() => { if(confirm('Hapus paket?')) setMenuPackages(prev => prev.filter(p => p.id !== pkg.id)) }} className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500 rounded-xl transition-all cursor-pointer flex items-center justify-center"><Trash2 size={16}/></button>
                             </div>
                          </div>
                       </div>
                    </div>
                 ))
              )}
           </div>
        </div>
      )}

      {/* MODAL PENAWARAN (MULTI QUOTATION) */}
      {showQuotationPreview && selectedPackagesData.length > 0 && (
        <div className="fixed inset-0 z-[200] flex justify-center items-start px-4 animate-fade-in no-print overflow-y-auto py-10">
           <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowQuotationPreview(false)} />
           <div className="relative w-full max-w-6xl bg-white dark:bg-gray-900 rounded-[4rem] shadow-2xl p-6 sm:p-12 animate-scale-in">
              <div className="mb-10 flex flex-col md:flex-row items-end gap-6 no-print border-b dark:border-gray-800 pb-10">
                 <div className="flex-1 space-y-3 w-full text-left">
                    <label className="text-[11px] font-black text-indigo-600 uppercase tracking-widest ml-1">Kepada Yth (Nama Penerima Penawaran):</label>
                    <input 
                      type="text" 
                      autoFocus
                      value={quotationCustomer} 
                      onChange={e => setQuotationCustomer(e.target.value.toUpperCase())}
                      placeholder="MISAL: PANITIA REUNI / PT. MAJU MUNDUR..." 
                      className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-[1.5rem] px-8 py-5 outline-none font-black text-base uppercase shadow-inner" 
                    />
                 </div>
                 <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={() => setShowQuotationPreview(false)} className="p-5 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-400 hover:text-black transition-all cursor-pointer"><X size={28}/></button>
                 </div>
              </div>

              <div className="w-full overflow-x-auto pb-4 custom-scrollbar flex justify-center">
                <div id="res-quotation-multi-capture" className="bg-white p-20 text-left text-black relative border border-gray-100 mx-auto shadow-sm" style={{ width: '210mm', minHeight: '297mm' }}>
                   {/* WATERMARK */}
                   <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center z-0">
                      {businessInfo.logoUrl ? (
                         <img src={businessInfo.logoUrl} alt="Watermark" className="w-2/3 h-auto object-contain grayscale" />
                      ) : (
                         <div className="text-[140px] font-black uppercase rotate-[-35deg] tracking-tighter">LM KOPI</div>
                      )}
                   </div>

                   <div className="relative z-10">
                      {/* LOGO TERPUSAT */}
                      <div className="flex flex-col items-center mb-12 pb-10 border-b-[8px] border-black">
                         {businessInfo.logoUrl ? (
                            <img src={businessInfo.logoUrl} alt="Logo" className="h-24 w-auto object-contain mb-4" />
                         ) : (
                            <div className="w-24 h-24 bg-black text-white rounded-[2rem] flex items-center justify-center font-black text-3xl mb-4 shadow-lg">LM</div>
                         )}
                         <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.6em] text-center">Event Offer & Executive Quotation</p>
                      </div>

                      <div className="flex justify-between items-start mb-16">
                         <div className="text-left space-y-6">
                            <h2 className="text-5xl font-black uppercase text-indigo-700 leading-none tracking-tighter">QUOTATION</h2>
                            <div>
                               <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] border-b-2 border-indigo-100 pb-2 mb-3">DITUJUKAN KEPADA:</p>
                               <p className="text-2xl font-black uppercase tracking-tight text-gray-900">{quotationCustomer || 'CALON TAMU TERHORMAT'}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="bg-gray-100 px-6 py-3 rounded-2xl border border-gray-200">
                               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Tanggal Dokumen</p>
                               <p className="text-sm font-black uppercase text-gray-900">{getIndonesianDate(new Date().toISOString().split('T')[0])}</p>
                            </div>
                         </div>
                      </div>

                      <p className="text-sm font-medium leading-relaxed mb-12 italic text-gray-600">
                        Bersama surat ini kami lampirkan beberapa opsi paket pilihan menu eksklusif dari {businessInfo.name} yang telah kami rancang khusus untuk kebutuhan acara Bapak/Ibu:
                      </p>

                      <div className="space-y-10 mb-20">
                         {selectedPackagesData.map((pkg, idx) => (
                            <div key={pkg.id} className="p-10 bg-gray-50/50 rounded-[3.5rem] border-2 border-indigo-100 relative overflow-hidden group">
                               <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><Package size={150}/></div>
                               
                               <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 border-b border-indigo-100 pb-8">
                                  <div className="space-y-1">
                                     <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Opsi {idx + 1}</span>
                                     <h4 className="text-2xl font-black uppercase tracking-tighter text-indigo-700">{pkg.name}</h4>
                                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{pkg.category}</p>
                                  </div>
                                  <div className="text-right">
                                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Harga Investasi Paket</p>
                                     <p className="text-3xl font-black text-gray-900 leading-none">{formatCurrency(pkg.pricePerPax)} <span className="text-xs opacity-40">/ PAX</span></p>
                                  </div>
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                  <div className="space-y-4">
                                     <h5 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-indigo-600"><Utensils size={14}/> Menu Utama</h5>
                                     <p className="text-[11pt] font-bold leading-[1.8] uppercase text-gray-700 whitespace-pre-line">{pkg.foodItems || '-'}</p>
                                  </div>
                                  <div className="space-y-4">
                                     <h5 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-blue-600"><Coffee size={14}/> Pilihan Minuman</h5>
                                     <p className="text-[11pt] font-bold leading-[1.8] uppercase text-gray-700 whitespace-pre-line">{pkg.beverageItems || '-'}</p>
                                  </div>
                               </div>
                            </div>
                         ))}
                      </div>

                      <div className="mt-20 flex flex-col md:flex-row justify-between px-10 text-center gap-12">
                         <div className="flex-1 max-w-[250px]"><p className="text-[10px] font-black text-gray-400 mb-20 tracking-widest uppercase">SALES & MARKETING MANAGER</p><div className="border-b-4 border-black w-full mb-2"></div><p className="text-[11pt] font-black uppercase">{businessInfo.managerName || 'OFFICIAL MANAGEMENT'}</p></div>
                         
                         <div className="flex flex-col items-center justify-center p-8 bg-indigo-50 rounded-[2.5rem] border-2 border-indigo-100 flex-1">
                            <p className="text-[10px] font-black text-indigo-400 mb-4 tracking-[0.2em] uppercase italic">Pemesanan & Reservasi</p>
                            <div className="flex items-center gap-3 text-indigo-600">
                               <Smartphone size={32}/>
                               <span className="text-2xl font-black tracking-tight">{businessInfo.phone || '08XX XXXX XXXX'}</span>
                            </div>
                            <p className="text-[9px] font-bold text-indigo-400 uppercase mt-4">WhatsApp Business Aktif</p>
                         </div>
                      </div>

                      <div className="mt-32 pt-10 border-t border-dashed border-gray-200 text-center">
                         <p className="text-[8pt] font-bold text-gray-300 uppercase tracking-[0.5em]">SYSTEM GENERATED DOCUMENT • OFFICIAL PROPOSAL • LEMBAH MANAH KOPI</p>
                      </div>
                   </div>
                </div>
              </div>
              <div className="mt-12 flex flex-col sm:flex-row gap-4 max-w-[900px] mx-auto pb-20 no-print">
                 <button onClick={() => handleCaptureSlip('res-quotation-multi-capture', `OFFER_LMK_${quotationCustomer.replace(/\s+/g, '_')}`)} className="flex-1 py-7 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-4 hover:bg-emerald-700 transition-all active:scale-95 cursor-pointer">{isCapturing ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />} SIMPAN PENAWARAN (JPG)</button>
                 <button onClick={() => window.print()} className="flex-1 py-7 bg-black text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-4 hover:bg-gray-900 transition-all active:scale-95 cursor-pointer"><Printer size={24} /> CETAK / SIMPAN PDF</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL PAKET FORM */}
      {showPackageForm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 animate-fade-in no-print">
           <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowPackageForm(false)} />
           <div className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-[3rem] p-10 lg:p-14 animate-scale-in border-t-8 border-indigo-600 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-10">{editingPackage ? 'Update Paket Menu' : 'Rancang Paket Baru'}</h3>
              <form onSubmit={handleSavePackage} className="space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-6 space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Nama Paket</label>
                       <input required value={packageFormData.name} onChange={e => setPackageFormData({...packageFormData, name: e.target.value.toUpperCase()})} placeholder="PAKET BUFFET A..." className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-sm uppercase shadow-inner" />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Kategori Paket (Layanan)</label>
                       <div className="relative">
                          <select value={packageFormData.category} onChange={e => setPackageFormData({...packageFormData, category: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-xs appearance-none uppercase shadow-inner">
                             {safeServiceTypes.map(st => <option key={st} value={st}>{st}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                       </div>
                    </div>
                    <div className="md:col-span-3 space-y-2">
                       <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-3">Harga per Pax</label>
                       <input type="text" value={packageFormData.pricePerPax?.toLocaleString('id-ID') || ''} onChange={e => setPackageFormData({...packageFormData, pricePerPax: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0})} className="w-full bg-indigo-50 dark:bg-indigo-900/20 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-xl text-indigo-700" />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <div className="flex justify-between items-center"><label className="text-[10px] font-black text-gray-400 uppercase ml-3">Komposisi Makanan</label><button type="button" onClick={() => { setPickerMode({target: 'PKG_FOOD', cat: 'FOOD'}); setShowMenuPicker(true); }} className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase flex items-center gap-1 hover:bg-indigo-600 hover:text-white transition-all"><Plus size={12}/> Pilih Menu</button></div>
                       <textarea value={packageFormData.foodItems} onChange={e => setPackageFormData({...packageFormData, foodItems: e.target.value.toUpperCase()})} placeholder="Daftar makanan..." className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-6 text-xs font-bold h-32 outline-none resize-none shadow-inner" />
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between items-center"><label className="text-[10px] font-black text-gray-400 uppercase ml-3">Varian Minuman</label><button type="button" onClick={() => { setPickerMode({target: 'PKG_BEV', cat: 'BEVERAGE'}); setShowMenuPicker(true); }} className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase flex items-center gap-1 hover:bg-indigo-600 hover:text-white transition-all"><Plus size={12}/> Pilih Menu</button></div>
                       <textarea value={packageFormData.beverageItems} onChange={e => setPackageFormData({...packageFormData, beverageItems: e.target.value.toUpperCase()})} placeholder="Daftar minuman..." className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-6 text-xs font-bold h-32 outline-none resize-none shadow-inner" />
                    </div>
                 </div>

                 <button type="submit" className="w-full py-7 bg-indigo-600 text-white rounded-[2.2rem] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"><Save size={20}/> Simpan Katalog Paket</button>
              </form>
           </div>
        </div>
      )}

      {/* FORM RESERVASI (MODAL) */}
      {showForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 animate-fade-in no-print">
           <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowForm(false)} />
           <div className="relative w-full max-w-6xl bg-white dark:bg-gray-900 rounded-[3rem] p-10 lg:p-14 animate-scale-in border-t-8 border-emerald-600 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-10">{editingRes ? 'Update Data Booking' : 'Booking Reservasi Baru'}</h3>
              <form onSubmit={handleSubmitBooking} className="space-y-10">
                 {/* BARIS 1: IDENTITAS TAMU */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Nama Tamu / Penanggung Jawab</label><input required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value.toUpperCase()})} placeholder="KELUARGA BESAR..." className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-[1.5rem] px-8 py-5 outline-none font-black text-sm uppercase shadow-inner transition-all" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">No. WhatsApp</label><input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="08..." className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-[1.5rem] px-8 py-5 outline-none font-black text-sm shadow-inner transition-all" /></div>
                 </div>

                 {/* BARIS 2: JADWAL & JUMLAH */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-gray-50 dark:bg-gray-800/40 rounded-[2.5rem] border border-gray-100 dark:border-gray-700">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Tanggal</label><input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-white dark:bg-gray-900 rounded-2xl px-6 py-4 outline-none font-black text-xs" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Jam</label><input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full bg-white dark:bg-gray-900 rounded-2xl px-6 py-4 outline-none font-black text-xs" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Pax</label><input required type="number" value={formData.guests} onChange={e => setFormData({...formData, guests: parseInt(e.target.value) || 1})} className="w-full bg-white dark:bg-gray-900 rounded-2xl px-6 py-4 outline-none font-black text-lg text-center" /></div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-3">DP Masuk (Booking Fee)</label>
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400 text-[10px]">Rp</span>
                          <input type="text" value={formData.dpAmount?.toLocaleString('id-ID') || ''} onChange={e => setFormData({...formData, dpAmount: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0})} className="w-full bg-white dark:bg-gray-900 pl-10 pr-4 py-4 rounded-2xl outline-none font-black text-sm text-emerald-700 border-2 border-transparent focus:border-emerald-600 shadow-sm" />
                       </div>
                    </div>
                 </div>

                 {/* BARIS 3: DETAIL PAKETAN & STATUS */}
                 <div className="w-full p-8 rounded-[2.5rem] border-2 space-y-8 shadow-sm transition-colors duration-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center border-b border-indigo-100 dark:border-indigo-800 pb-6">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kategori Event</label>
                          <div className="relative">
                              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-3 font-black text-[11px] uppercase appearance-none shadow-sm cursor-pointer">
                                {safeReservationCategories.map(st => <option key={st} value={st}>{st}</option>)}
                              </select>
                              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipe Layanan</label>
                          <div className="relative">
                              <select 
                                value={formData.serviceType} 
                                onChange={e => handleServiceTypeChange(e.target.value)} 
                                className="w-full bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-3 font-black text-[11px] uppercase appearance-none shadow-sm cursor-pointer"
                              >
                                {safeServiceTypes.map(st => <option key={st} value={st}>{st}</option>)}
                              </select>
                              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-1 flex items-center gap-1"><ListRestart size={10}/> Status Booking</label>
                          <div className="relative">
                              <select 
                                value={formData.status} 
                                onChange={e => setFormData({...formData, status: e.target.value as any})}
                                className={`w-full bg-white dark:bg-gray-900 border-2 rounded-xl px-4 py-3 font-black text-[11px] uppercase appearance-none shadow-sm cursor-pointer transition-colors ${formData.status === 'CONFIRMED' ? 'border-emerald-500 text-emerald-600' : formData.status === 'CANCELLED' ? 'border-red-500 text-red-600' : 'border-orange-500 text-orange-600'}`}
                              >
                                <option value="PENDING">WAITING (PENDING)</option>
                                <option value="CONFIRMED">TERKONFIRMASI (CONFIRMED)</option>
                                <option value="COMPLETED">SELESAI (COMPLETED)</option>
                                <option value="CANCELLED">BATAL (CANCELLED)</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                    </div>

                    {/* KONDISI KHUSUS: ALA CARTE PER PAX */}
                    {formData.serviceType === 'ALA CARTE PER PAX' ? (
                      <div className="animate-fade-in space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><ClipboardList size={18}/></div>
                                <h4 className="text-sm font-black uppercase tracking-tighter">Detail Pesanan Per Tamu</h4>
                            </div>
                            <button type="button" onClick={handleAddPaxRow} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all"><UserPlus2 size={14}/> Tambah Baris</button>
                          </div>
                          
                          <div className="overflow-x-auto">
                            <table className="w-full border-separate border-spacing-y-2">
                                <thead>
                                  <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                      <th className="px-4 py-2 text-left">Nama Tamu</th>
                                      <th className="px-4 py-2 text-left">Pilihan Makanan</th>
                                      <th className="px-4 py-2 text-left">Pilihan Minuman</th>
                                      <th className="px-4 py-2 text-center w-10"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(formData.paxOrders || []).map((pax, idx) => (
                                      <tr key={idx} className="bg-white dark:bg-gray-950 rounded-xl shadow-sm animate-slide-up group">
                                        <td className="px-2 py-2">
                                            <input 
                                              value={pax.name} 
                                              onChange={e => updatePaxField(idx, 'name', e.target.value.toUpperCase())}
                                              placeholder="NAMA..."
                                              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-[10px] font-black uppercase outline-none focus:ring-1 focus:ring-emerald-500" 
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex gap-1">
                                              <input 
                                                  readOnly
                                                  value={pax.food} 
                                                  placeholder="PILIH MENU..."
                                                  className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-[10px] font-bold uppercase outline-none truncate" 
                                              />
                                              <button type="button" onClick={() => { setPickerMode({target: 'PAX_FOOD', cat: 'FOOD', paxIndex: idx}); setShowMenuPicker(true); }} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><Plus size={12}/></button>
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex gap-1">
                                              <input 
                                                  readOnly
                                                  value={pax.drink} 
                                                  placeholder="PILIH MINUM..."
                                                  className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-[10px] font-bold uppercase outline-none truncate" 
                                              />
                                              <button type="button" onClick={() => { setPickerMode({target: 'PAX_DRINK', cat: 'BEVERAGE', paxIndex: idx}); setShowMenuPicker(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Plus size={12}/></button>
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <button type="button" onClick={() => handleRemovePaxRow(idx)} className="p-2 text-red-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><UserMinus size={14}/></button>
                                        </td>
                                      </tr>
                                  ))}
                                  {(formData.paxOrders || []).length === 0 && (
                                      <tr><td colSpan={4} className="py-10 text-center opacity-30 italic font-black uppercase text-[10px]">Klik tombol Tambah Baris untuk memulai pesanan per orang</td></tr>
                                  )}
                                </tbody>
                            </table>
                          </div>
                      </div>
                    ) : formData.serviceType === 'ALA CARTE' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[9px] font-black text-gray-400 uppercase">Komposisi Makanan</label>
                              <button type="button" onClick={() => { setPickerMode({target: 'GLOBAL_FOOD', cat: 'FOOD'}); setShowMenuPicker(true); }} className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded uppercase flex items-center gap-1 hover:bg-emerald-600 hover:text-white transition-all"><Plus size={10}/> Pilih Menu</button>
                            </div>
                            <textarea value={formData.foodSelection} onChange={e => setFormData({...formData, foodSelection: e.target.value.toUpperCase()})} placeholder="List makanan..." className="w-full bg-white dark:bg-gray-950 rounded-xl p-4 text-[10px] font-bold h-24 outline-none resize-none border dark:border-gray-800 shadow-inner" />
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[9px] font-black text-gray-400 uppercase">Varian Minuman</label>
                              <button type="button" onClick={() => { setPickerMode({target: 'GLOBAL_BEV', cat: 'BEVERAGE'}); setShowMenuPicker(true); }} className="text-[8px] font-black bg-blue-100 text-blue-700 px-2 py-1 rounded uppercase flex items-center gap-1 hover:bg-blue-600 hover:text-white transition-all"><Plus size={10}/> Pilih Menu</button>
                            </div>
                            <textarea value={formData.beverageSelection} onChange={e => setFormData({...formData, beverageSelection: e.target.value.toUpperCase()})} placeholder="List minuman..." className="w-full bg-white dark:bg-gray-950 rounded-xl p-4 text-[10px] font-bold h-24 outline-none resize-none border dark:border-gray-800 shadow-inner" />
                        </div>
                      </div>
                    ) : (
                      /* KONDISI LAYANAN PAKET: HARUS PILIH PAKET */
                      <div className="space-y-6 animate-fade-in">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Package size={14}/> Pilih Paket Menu dari Katalog ({formData.serviceType})
                            </label>
                            <div className="relative">
                                <select 
                                  value={formData.packageName} 
                                  onChange={e => handleSelectPackage(e.target.value)}
                                  className="w-full bg-white dark:bg-gray-900 border-2 border-indigo-200 focus:border-indigo-600 rounded-2xl px-6 py-4 outline-none font-black text-sm uppercase appearance-none shadow-sm cursor-pointer"
                                >
                                  <option value="">-- PILIH PAKET SESUAI LAYANAN --</option>
                                  {availablePackagesForService.map(p => <option key={p.id} value={p.name}>{p.name} (@ {formatCurrency(p.pricePerPax)})</option>)}
                                  {availablePackagesForService.length === 0 && <option disabled>BELUM ADA PAKET UNTUK LAYANAN INI</option>}
                                </select>
                                <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                            </div>
                          </div>

                          {formData.packageName && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-scale-in">
                                <div className="p-5 bg-white dark:bg-gray-950 rounded-2xl border border-indigo-100 shadow-inner">
                                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Utensils size={10}/> Isi Makanan:</p>
                                  <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase leading-relaxed">{formData.foodSelection || '-'}</p>
                                </div>
                                <div className="p-5 bg-white dark:bg-gray-950 rounded-2xl border border-indigo-100 shadow-inner">
                                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Coffee size={10}/> Isi Minuman:</p>
                                  <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase leading-relaxed">{formData.beverageSelection || '-'}</p>
                                </div>
                            </div>
                          )}
                      </div>
                    )}
                 </div>

                 <button type="submit" className="w-full py-7 bg-emerald-600 text-white rounded-[2.2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 cursor-pointer">
                    <Save size={24}/> Simpan Registrasi Reservasi
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* PRATINJAU SLIP (OPERASIONAL) */}
      {printingOpSlip && (
        <div className="fixed inset-0 z-[200] flex justify-center items-start px-4 animate-fade-in no-print overflow-y-auto py-10">
           <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setPrintingOpSlip(null)} />
           <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-6 sm:p-10 animate-scale-in">
              <div className="w-full overflow-x-auto pb-4 custom-scrollbar flex justify-center">
                <div id="res-op-slip-capture" className="bg-white p-12 text-left text-black relative border-4 border-black mx-auto overflow-hidden shadow-sm" style={{ width: '210mm', minHeight: '297mm' }}>
                   <div className="flex flex-col items-center text-center border-b-4 border-black pb-6 mb-8 gap-2"><h1 className="text-3xl font-black uppercase tracking-widest">SLIP ORDER RESERVASI</h1><span className="bg-black text-white px-3 py-1 text-[11px] font-black uppercase tracking-widest">INTERNAL OPERATIONAL USE ONLY</span></div>
                   <div className="grid grid-cols-2 gap-8 mb-8 border-b-2 border-black pb-8"><div className="space-y-4"><div><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">NAMA TAMU / BOOKING:</p><p className="text-3xl font-black uppercase">{printingOpSlip.customerName}</p></div><div className="flex items-center gap-6 pt-2"><div><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">JUMLAH TAMU:</p><p className="text-4xl font-black text-red-600">{printingOpSlip.guests} <span className="text-base text-black">PAX</span></p></div><div><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">TIPE LAYANAN:</p><p className="text-xl font-black uppercase text-indigo-700">{printingOpSlip.serviceType || 'BUFFET'}</p></div></div></div><div className="space-y-4 text-right"><div><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">WAKTU PELAKSANAAN:</p><p className="text-xl font-black uppercase">{getIndonesianDate(printingOpSlip.date)}</p><p className="text-3xl font-black uppercase text-red-600 mt-1">{printingOpSlip.time} WIB</p></div><div><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">LOKASI AREA:</p><p className="text-xl font-black uppercase flex items-center justify-end gap-2"><MapPin size={24}/> {printingOpSlip.area}</p></div></div></div>
                   
                   {printingOpSlip.serviceType === 'ALA CARTE PER PAX' && printingOpSlip.paxOrders && printingOpSlip.paxOrders.length > 0 ? (
                      <div className="space-y-6">
                         <h3 className="text-sm font-black uppercase tracking-widest border-b-2 border-black pb-2 mb-4 flex items-center gap-2"><Users size={18}/> RINCIAN PESANAN PER TAMU</h3>
                         <table className="w-full border-collapse">
                            <thead>
                               <tr className="bg-gray-100 border-2 border-black font-black uppercase text-[10px]">
                                  <th className="p-3 border-r-2 border-black w-32">Nama Orang</th>
                                  <th className="p-3 border-r-2 border-black">Menu Makanan</th>
                                  <th className="p-3">Menu Minuman</th>
                               </tr>
                            </thead>
                            <tbody>
                               {printingOpSlip.paxOrders.map((p, idx) => (
                                  <tr key={idx} className="border-2 border-black">
                                     <td className="p-3 border-r-2 border-black font-black uppercase text-xs">{p.name || `Tamu ${idx+1}`}</td>
                                     <td className="p-3 border-r-2 border-black font-bold uppercase text-xs text-red-600">{p.food || '-'}</td>
                                     <td className="p-3 font-bold uppercase text-xs text-blue-600">{p.drink || '-'}</td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   ) : (
                      <div className="space-y-8">
                         {printingOpSlip.packageName && (
                            <div className="mb-6 px-6 py-4 bg-gray-50 border-2 border-black rounded-2xl flex items-center gap-3">
                               <Package size={20}/>
                               <div>
                                  <p className="text-[9px] font-black text-gray-400 uppercase">Paket Digunakan:</p>
                                  <p className="text-base font-black uppercase">{printingOpSlip.packageName}</p>
                               </div>
                            </div>
                         )}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="border-2 border-black p-6 rounded-2xl h-full"><h3 className="text-sm font-black uppercase tracking-widest border-b-2 border-black pb-2 mb-4 flex items-center gap-2"><Utensils size={18}/> PESANAN MAKANAN</h3><div className="text-sm font-bold leading-relaxed whitespace-pre-line uppercase">{printingOpSlip.foodSelection || '-'}</div></div>
                            <div className="border-2 border-black p-6 rounded-2xl h-full"><h3 className="text-sm font-black uppercase tracking-widest border-b-2 border-black pb-2 mb-4 flex items-center gap-2"><Coffee size={18}/> PESANAN MINUMAN</h3><div className="text-sm font-bold leading-relaxed whitespace-pre-line uppercase">{printingOpSlip.beverageSelection || '-'}</div></div>
                         </div>
                      </div>
                   )}

                   <div className="mt-20 pt-10 border-t-4 border-black grid grid-cols-3 gap-8 text-center uppercase"><div><p className="text-[10px] text-gray-400 mb-20 tracking-widest uppercase">PREPARED BY (ADMIN)</p><div className="border-b-2 border-black w-full mb-1"></div><p className="text-[11px] font-black">LMK FINANCE</p></div><div><p className="text-[10px] text-gray-400 mb-20 tracking-widest uppercase">KITCHEN MANAGER</p><div className="border-b-2 border-black w-full mb-1"></div><p className="text-[11px] font-black">HEAD CHEF</p></div><div><p className="text-[10px] text-gray-400 mb-20 tracking-widest uppercase">FLOOR SUPERVISOR</p><div className="border-b-2 border-black w-full mb-1"></div><p className="text-[11px] font-black">SERVICE CAPTAIN</p></div></div>
                </div>
              </div>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 max-w-[800px] mx-auto pb-10"><button onClick={() => handleCaptureSlip('res-op-slip-capture', `OP_SLIP_${printingOpSlip.customerName.replace(/\s+/g, '_')}`)} className="flex-1 py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-[13px] shadow-xl flex items-center justify-center gap-3 cursor-pointer">{isCapturing ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />} Simpan Slip JPG</button><button onClick={() => window.print()} className="flex-1 py-6 bg-black text-white rounded-[2rem] font-black uppercase text-[13px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all cursor-pointer"><Printer size={24} /> Cetak Slip</button></div>
           </div>
        </div>
      )}

      {/* KUITANSI DP */}
      {printingInvoice && (
        <div className="fixed inset-0 z-[200] flex justify-center items-start px-4 animate-fade-in no-print overflow-y-auto py-10">
           <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setPrintingInvoice(null)} />
           <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-6 sm:p-10 animate-scale-in">
              <div className="w-full overflow-x-auto pb-4 custom-scrollbar flex justify-center">
                <div id="res-invoice-capture" className="bg-white p-16 text-left text-black relative border border-gray-100 mx-auto overflow-hidden shadow-sm" style={{ width: '210mm', minHeight: '297mm' }}>
                   
                   {/* WATERMARK LOGO */}
                   <div className="absolute inset-0 pointer-events-none opacity-[0.04] flex items-center justify-center z-0">
                      {businessInfo.logoUrl ? (
                         <img src={businessInfo.logoUrl} alt="Watermark" className="w-2/3 h-auto object-contain grayscale" />
                      ) : (
                         <div className="text-[120px] font-black uppercase rotate-[-35deg]">LM KOPI</div>
                      )}
                   </div>

                   <div className="relative z-10">
                      {/* LOGO TERPUSAT */}
                      <div className="flex flex-col items-center mb-10 pb-8 border-b-[5px] border-black">
                         {businessInfo.logoUrl ? (
                            <img src={businessInfo.logoUrl} alt="Logo" className="h-20 w-auto object-contain mb-4" />
                         ) : (
                            <div className="w-20 h-20 bg-black text-white rounded-xl flex items-center justify-center font-black text-2xl mb-4">LM</div>
                         )}
                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] text-center">Bukti Pembayaran Down Payment (DP)</p>
                      </div>

                      <div className="flex justify-between items-start mb-12">
                         <div className="text-left">
                            <h2 className="text-4xl font-black uppercase text-indigo-600 leading-none">RECEIPT</h2>
                            <p className="text-[11px] font-black uppercase tracking-widest mt-2">NO: DP/{printingInvoice.id.slice(-6).toUpperCase()}</p>
                         </div>
                         <div className="text-right">
                            <span className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md">DANA TERKONFIRMASI</span>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-12 mb-16 text-sm font-bold uppercase">
                         <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-400 mb-2 border-b pb-1 tracking-[0.2em]">DITERIMA DARI:</p>
                            <p className="text-2xl font-black">{printingInvoice.customerName}</p>
                            <p className="text-indigo-600 text-lg">{printingInvoice.phone}</p>
                         </div>
                         <div className="text-right space-y-4">
                            <p className="text-[10px] font-black text-gray-400 mb-2 border-b pb-1 tracking-[0.2em]">DETAIL BOOKING:</p>
                            <p className="text-lg">{printingInvoice.date}</p>
                            <p className="text-lg">{printingInvoice.time} WIB • {printingInvoice.area}</p>
                            <p className="text-indigo-600 text-xl font-black">{printingInvoice.guests} PAX • {printingInvoice.category}</p>
                         </div>
                      </div>

                      <div className="mb-16 p-10 bg-indigo-50/50 rounded-[3rem] border-2 border-indigo-100 text-center relative overflow-hidden shadow-inner">
                         <p className="text-[12px] font-black text-gray-400 uppercase tracking-[0.5em] mb-4 relative z-10">NOMINAL UANG MUKA (DP)</p>
                         <h4 className="text-6xl font-black text-indigo-700 tracking-tighter relative z-10">{formatCurrency(printingInvoice.dpAmount)}</h4>
                      </div>

                      <div className="mt-32 pt-10 border-t border-dashed border-gray-200 text-center">
                         <p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.5em]">SYSTEM GENERATED RECEIPT • VALID WITHOUT SIGNATURE • OFFICIAL LMK AUDIT</p>
                      </div>
                   </div>
                </div>
              </div>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 max-w-[800px] mx-auto pb-10"><button onClick={() => handleCaptureSlip('res-invoice-capture', `RECEIPT_DP_${printingInvoice.customerName.replace(/\s+/g, '_')}`)} className="flex-1 py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-[13px] shadow-xl flex items-center justify-center gap-3 cursor-pointer">{isCapturing ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />} Simpan Kuitansi JPG</button><button onClick={() => window.print()} className="flex-1 py-6 bg-black text-white rounded-[2rem] font-black uppercase text-[13px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all cursor-pointer"><Printer size={24} /> Cetak / PDF</button></div>
           </div>
        </div>
      )}

      {/* PRATINJAU PENAWARAN (MULTI QUOTATION) */}
      {showQuotationPreview && selectedPackagesData.length > 0 && (
        <div className="fixed inset-0 z-[200] flex justify-center items-start px-4 animate-fade-in no-print overflow-y-auto py-10">
           <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowQuotationPreview(false)} />
           <div className="relative w-full max-w-6xl bg-white dark:bg-gray-900 rounded-[4rem] shadow-2xl p-6 sm:p-12 animate-scale-in">
              <div className="mb-10 flex flex-col md:flex-row items-end gap-6 no-print border-b dark:border-gray-800 pb-10">
                 <div className="flex-1 space-y-3 w-full text-left">
                    <label className="text-[11px] font-black text-indigo-600 uppercase tracking-widest ml-1">Kepada Yth (Nama Penerima Penawaran):</label>
                    <input 
                      type="text" 
                      autoFocus
                      value={quotationCustomer} 
                      onChange={e => setQuotationCustomer(e.target.value.toUpperCase())}
                      placeholder="MISAL: PANITIA REUNI / PT. MAJU MUNDUR..." 
                      className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-[1.5rem] px-8 py-5 outline-none font-black text-base uppercase shadow-inner" 
                    />
                 </div>
                 <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={() => setShowQuotationPreview(false)} className="p-5 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-400 hover:text-black transition-all cursor-pointer"><X size={28}/></button>
                 </div>
              </div>

              <div className="w-full overflow-x-auto pb-4 custom-scrollbar flex justify-center">
                <div id="res-quotation-multi-capture" className="bg-white p-20 text-left text-black relative border border-gray-100 mx-auto shadow-sm" style={{ width: '210mm', minHeight: '297mm' }}>
                   {/* WATERMARK */}
                   <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center z-0">
                      {businessInfo.logoUrl ? (
                         <img src={businessInfo.logoUrl} alt="Watermark" className="w-2/3 h-auto object-contain grayscale" />
                      ) : (
                         <div className="text-[140px] font-black uppercase rotate-[-35deg] tracking-tighter">LM KOPI</div>
                      )}
                   </div>

                   <div className="relative z-10">
                      {/* LOGO TERPUSAT */}
                      <div className="flex flex-col items-center mb-12 pb-10 border-b-[8px] border-black">
                         {businessInfo.logoUrl ? (
                            <img src={businessInfo.logoUrl} alt="Logo" className="h-24 w-auto object-contain mb-4" />
                         ) : (
                            <div className="w-24 h-24 bg-black text-white rounded-[2rem] flex items-center justify-center font-black text-3xl mb-4 shadow-lg">LM</div>
                         )}
                         <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.6em] text-center">Event Offer & Executive Quotation</p>
                      </div>

                      <div className="flex justify-between items-start mb-16">
                         <div className="text-left space-y-6">
                            <h2 className="text-5xl font-black uppercase text-indigo-700 leading-none tracking-tighter">QUOTATION</h2>
                            <div>
                               <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] border-b-2 border-indigo-100 pb-2 mb-3">DITUJUKAN KEPADA:</p>
                               <p className="text-2xl font-black uppercase tracking-tight text-gray-900">{quotationCustomer || 'CALON TAMU TERHORMAT'}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="bg-gray-100 px-6 py-3 rounded-2xl border border-gray-200">
                               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Tanggal Dokumen</p>
                               <p className="text-sm font-black uppercase text-gray-900">{getIndonesianDate(new Date().toISOString().split('T')[0])}</p>
                            </div>
                         </div>
                      </div>

                      <p className="text-sm font-medium leading-relaxed mb-12 italic text-gray-600">
                        Bersama surat ini kami lampirkan beberapa opsi paket pilihan menu eksklusif dari {businessInfo.name} yang telah kami rancang khusus untuk kebutuhan acara Bapak/Ibu:
                      </p>

                      <div className="space-y-10 mb-20">
                         {selectedPackagesData.map((pkg, idx) => (
                            <div key={pkg.id} className="p-10 bg-gray-50/50 rounded-[3.5rem] border-2 border-indigo-100 relative overflow-hidden group">
                               <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><Package size={150}/></div>
                               
                               <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 border-b border-indigo-100 pb-8">
                                  <div className="space-y-1">
                                     <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Opsi {idx + 1}</span>
                                     <h4 className="text-2xl font-black uppercase tracking-tighter text-indigo-700">{pkg.name}</h4>
                                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{pkg.category}</p>
                                  </div>
                                  <div className="text-right">
                                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Harga Investasi Paket</p>
                                     <p className="text-3xl font-black text-gray-900 leading-none">{formatCurrency(pkg.pricePerPax)} <span className="text-xs opacity-40">/ PAX</span></p>
                                  </div>
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                  <div className="space-y-4">
                                     <h5 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-indigo-600"><Utensils size={14}/> Menu Utama</h5>
                                     <p className="text-[11pt] font-bold leading-[1.8] uppercase text-gray-700 whitespace-pre-line">{pkg.foodItems || '-'}</p>
                                  </div>
                                  <div className="space-y-4">
                                     <h5 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-blue-600"><Coffee size={14}/> Pilihan Minuman</h5>
                                     <p className="text-[11pt] font-bold leading-[1.8] uppercase text-gray-700 whitespace-pre-line">{pkg.beverageItems || '-'}</p>
                                  </div>
                               </div>
                            </div>
                         ))}
                      </div>

                      <div className="mt-20 flex flex-col md:flex-row justify-between px-10 text-center gap-12">
                         <div className="flex-1 max-w-[250px]"><p className="text-[10px] font-black text-gray-400 mb-20 tracking-widest uppercase">SALES & MARKETING MANAGER</p><div className="border-b-4 border-black w-full mb-2"></div><p className="text-[11pt] font-black uppercase">{businessInfo.managerName || 'OFFICIAL MANAGEMENT'}</p></div>
                         
                         <div className="flex flex-col items-center justify-center p-8 bg-indigo-50 rounded-[2.5rem] border-2 border-indigo-100 flex-1">
                            <p className="text-[10px] font-black text-indigo-400 mb-4 tracking-[0.2em] uppercase italic">Pemesanan & Reservasi</p>
                            <div className="flex items-center gap-3 text-indigo-600">
                               <Smartphone size={32}/>
                               <span className="text-2xl font-black tracking-tight">{businessInfo.phone || '08XX XXXX XXXX'}</span>
                            </div>
                            <p className="text-[9px] font-bold text-indigo-400 uppercase mt-4">WhatsApp Business Aktif</p>
                         </div>
                      </div>

                      <div className="mt-32 pt-10 border-t border-dashed border-gray-200 text-center">
                         <p className="text-[8pt] font-bold text-gray-300 uppercase tracking-[0.5em]">SYSTEM GENERATED DOCUMENT • OFFICIAL PROPOSAL • LEMBAH MANAH KOPI</p>
                      </div>
                   </div>
                </div>
              </div>
              <div className="mt-12 flex flex-col sm:flex-row gap-4 max-w-[900px] mx-auto pb-20 no-print">
                 <button onClick={() => handleCaptureSlip('res-quotation-multi-capture', `OFFER_LMK_${quotationCustomer.replace(/\s+/g, '_')}`)} className="flex-1 py-7 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-4 hover:bg-emerald-700 transition-all active:scale-95 cursor-pointer">{isCapturing ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />} SIMPAN PENAWARAN (JPG)</button>
                 <button onClick={() => window.print()} className="flex-1 py-7 bg-black text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-4 hover:bg-gray-900 transition-all active:scale-95 cursor-pointer"><Printer size={24} /> CETAK / SIMPAN PDF</button>
              </div>
           </div>
        </div>
      )}

      {/* MENU PICKER MODAL */}
      {showMenuPicker && (
         <div className="fixed inset-0 z-[250] flex items-center justify-center px-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowMenuPicker(false)} />
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 animate-scale-in border-t-8 border-indigo-600 max-h-[80vh] overflow-hidden flex flex-col">
               <div className="flex items-center justify-between mb-8 shrink-0">
                  <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><ChefHat size={24} className="text-indigo-600" /> Katalog Menu LMK</h3>
                  <button onClick={() => setShowMenuPicker(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"><X size={24}/></button>
               </div>
               <div className="relative mb-6 shrink-0"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input autoFocus type="text" placeholder="Cari nama menu..." value={menuSearchTerm} onChange={e => setMenuSearchTerm(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl pl-12 pr-6 py-4 outline-none font-bold text-sm uppercase shadow-inner" /></div>
               <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                  {filteredRecipes.map(recipe => (
                     <button key={recipe.id} onClick={() => handleSelectMenuItem(recipe.menuName)} className="w-full flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800 rounded-[1.5rem] border border-transparent hover:border-indigo-400 transition-all text-left group">
                        <div className="flex items-center gap-4">
                           <div className={`p-3 rounded-xl ${recipe.category === 'FOOD' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>{recipe.category === 'FOOD' ? <Utensils size={18}/> : <Coffee size={18}/>}</div>
                           <div><p className="text-sm font-black uppercase text-gray-900 dark:text-white leading-none mb-1">{recipe.menuName}</p><p className="text-[8px] font-bold text-gray-400 uppercase">{recipe.subCategory}</p></div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
                     </button>
                  ))}
               </div>
            </div>
         </div>
      )}

      {/* MASTER MODAL */}
      {showMasterModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 animate-fade-in no-print">
           <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowMasterModal(false)} />
           <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3rem] p-10 lg:p-12 animate-scale-in border-t-8 border-indigo-600 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><Settings size={24} className="text-indigo-600" /> Master Data Reservasi</h3>
                 <button onClick={() => setShowMasterModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"><X size={24}/></button>
              </div>

              <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-8 overflow-x-auto no-scrollbar">
                 <button onClick={() => setMasterTab('AREA')} className={`flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${masterTab === 'AREA' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Area</button>
                 <button onClick={() => setMasterTab('CATEGORY')} className={`flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${masterTab === 'CATEGORY' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Kategori</button>
                 <button onClick={() => setMasterTab('SERVICE_TYPE')} className={`flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${masterTab === 'SERVICE_TYPE' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Layanan</button>
                 <button onClick={() => setMasterTab('PAYMENT')} className={`flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${masterTab === 'PAYMENT' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Rekening</button>
                 <button onClick={() => setMasterTab('ADDITIONAL')} className={`flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${masterTab === 'ADDITIONAL' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Additional</button>
              </div>

              <div className="space-y-6">
                 {masterTab === 'PAYMENT' ? (
                   <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border">
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase">Nama Bank</label><input value={paymentConfig.bankName} onChange={e => setPaymentConfig({...paymentConfig, bankName: e.target.value.toUpperCase()})} className="w-full p-3 bg-white dark:bg-gray-950 rounded-xl border outline-none font-black text-xs uppercase" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase">Nomor Rekening</label><input value={paymentConfig.accountNumber} onChange={e => setPaymentConfig({...paymentConfig, accountNumber: e.target.value})} className="w-full p-3 bg-white dark:bg-gray-950 rounded-xl border outline-none font-black text-xs" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase">Nama Pemilik</label><input value={paymentConfig.accountHolder} onChange={e => setPaymentConfig({...paymentConfig, accountHolder: e.target.value.toUpperCase()})} className="w-full p-3 bg-white dark:bg-gray-950 rounded-xl border outline-none font-black text-xs uppercase" /></div>
                   </div>
                 ) : (
                   <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <input type="text" value={newMasterName} onChange={e => setNewMasterName(e.target.value.toUpperCase())} placeholder={`Nama ${masterTab} baru...`} className="flex-1 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-3 outline-none font-black text-xs uppercase" />
                        <button onClick={handleAddMaster} className="p-3 bg-indigo-600 text-white rounded-xl active:scale-90 cursor-pointer"><Plus size={20}/></button>
                      </div>
                      {masterTab === 'ADDITIONAL' && (
                        <div className="flex items-center gap-3">
                           <label className="text-[9px] font-black text-gray-400 uppercase">Harga Default:</label>
                           <input type="number" value={newMasterPrice} onChange={e => setNewMasterPrice(Number(e.target.value))} className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 text-xs font-black w-32 outline-none focus:border-indigo-500" />
                        </div>
                      )}
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                        {(masterTab === 'AREA' ? safeAreas : masterTab === 'CATEGORY' ? safeReservationCategories : masterTab === 'SERVICE_TYPE' ? safeServiceTypes : additionalCharges).map(item => {
                           const itemName = typeof item === 'string' ? item : item.name;
                           const itemPrice = typeof item === 'string' ? null : item.price;
                           return (
                             <div key={itemName} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl group border border-transparent hover:border-indigo-500 transition-all">
                                <div>
                                   <span className="text-xs font-black uppercase tracking-widest">{itemName}</span>
                                   {itemPrice !== null && <p className="text-[10px] font-bold text-indigo-600 mt-1">{formatCurrency(itemPrice)}</p>}
                                </div>
                                <button onClick={() => { 
                                  if(confirm('Hapus?')) { 
                                    if(masterTab === 'AREA') setAreas(p => p.filter(i => i !== itemName)); 
                                    else if(masterTab === 'CATEGORY') setReservationCategories(p => p.filter(i => i !== itemName)); 
                                    else if(masterTab === 'SERVICE_TYPE') setServiceTypes(p => p.filter(i => i !== itemName));
                                    else setAdditionalCharges(p => p.filter(ac => ac.name !== itemName));
                                  } 
                                }} className="p-2 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-xl transition-all cursor-pointer"><Trash2 size={16}/></button>
                             </div>
                           );
                        })}
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default ReservasiPage;
