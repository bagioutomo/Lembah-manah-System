
import React, { useState, useEffect } from 'react';
import { Wrench, ClipboardList, Sparkles } from 'lucide-react';
import { Employee, MaintenanceTask, OperationalChecklistItem, InventoryItem, UserRole } from '../types';
import OpMaintenanceManager from './OpMaintenanceManager'; 
import OpChecklistManager from './OpChecklistManager';

interface Props {
  employees: Employee[];
  maintenance: MaintenanceTask[];
  setMaintenance: React.Dispatch<React.SetStateAction<MaintenanceTask[]>>;
  checklist: OperationalChecklistItem[];
  setChecklist: React.Dispatch<React.SetStateAction<OperationalChecklistItem[]>>;
  inventoryItems: InventoryItem[];
  userRole: UserRole;
  initialTab?: 'CHECKLIST' | 'MAINTENANCE';
  // Tambahkan props kategori untuk checklist agar tersinkron cloud
  checklistCategories: string[];
  setChecklistCategories: React.Dispatch<React.SetStateAction<string[]>>;
}

const OperationalPage: React.FC<Props> = ({ 
  employees, 
  maintenance, 
  setMaintenance, 
  checklist, 
  setChecklist, 
  inventoryItems, 
  userRole,
  initialTab = 'CHECKLIST',
  checklistCategories,
  setChecklistCategories
}) => {
  const [activeTab, setActiveTab] = useState<'CHECKLIST' | 'MAINTENANCE'>(initialTab);

  // Sync tab if initialTab changes from App.tsx navigation
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className={`p-4 ${activeTab === 'CHECKLIST' ? 'bg-indigo-600' : 'bg-orange-600'} text-white rounded-[1.5rem] shadow-xl transition-colors duration-500`}>
            {activeTab === 'CHECKLIST' ? <ClipboardList size={28} /> : <Wrench size={28} />}
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tighter">
              {activeTab === 'CHECKLIST' ? 'Operational Checklist' : 'Service Management'}
            </h2>
            <p className="text-sm text-gray-500 font-medium italic">
              {activeTab === 'CHECKLIST' 
                ? 'Kendali mutu harian dan standarisasi kebersihan outlet.' 
                : 'Monitor kesehatan aset & manajemen vendor perbaikan.'}
            </p>
          </div>
        </div>

        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border dark:border-gray-700 w-full lg:w-auto">
          <button 
            onClick={() => setActiveTab('CHECKLIST')}
            className={`flex-1 lg:flex-none px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'CHECKLIST' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-md' : 'text-gray-400'}`}
          >
            Checklist
          </button>
          <button 
            onClick={() => setActiveTab('MAINTENANCE')}
            className={`flex-1 lg:flex-none px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'MAINTENANCE' ? 'bg-white dark:bg-gray-900 text-orange-600 shadow-md' : 'text-gray-400'}`}
          >
            Maintenance
          </button>
        </div>
      </div>

      {activeTab === 'CHECKLIST' ? (
        <OpChecklistManager 
          checklist={checklist} 
          setChecklist={setChecklist} 
          userRole={userRole}
          employees={employees}
          categories={checklistCategories}
          setCategories={setChecklistCategories}
        />
      ) : (
        <OpMaintenanceManager 
          maintenance={maintenance} 
          setMaintenance={setMaintenance} 
          employees={employees} 
          inventoryItems={inventoryItems}
        />
      )}
    </div>
  );
};

export default OperationalPage;
