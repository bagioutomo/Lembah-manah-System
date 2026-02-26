
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import TopNotification from './TopNotification';
import { UserRole, PageId, BusinessInfo, DashboardTask, InventoryItem, MaintenanceTask, BillRecord, Reservation, Article, ExpenseRecord } from '../types';

interface Props {
  userRole: UserRole;
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  businessInfo: BusinessInfo;
  theme: string;
  setTheme: (t: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (o: boolean) => void;
  setShowUserModal: (s: boolean) => void;
  expandedMenus: Record<string, boolean>;
  toggleMenu: (m: string) => void;
  viewMode: 'BULANAN' | 'TAHUNAN';
  setViewMode: (v: 'BULANAN' | 'TAHUNAN') => void;
  globalMonth: number;
  setGlobalMonth: (m: number) => void;
  globalYear: number;
  setGlobalYear: (y: number) => void;
  syncStatus: any;
  children: React.ReactNode;
  // Data tambahan untuk Notifikasi Header
  tasks?: DashboardTask[];
  inventoryItems?: InventoryItem[];
  maintenance?: MaintenanceTask[];
  bills?: BillRecord[];
  reservations?: Reservation[];
  articles?: Article[];
  expenses?: ExpenseRecord[];
}

const MainLayout: React.FC<Props> = (props) => {
  return (
    <div className={`flex h-screen overflow-hidden ${props.theme === 'dark' ? 'dark bg-black' : 'bg-gray-50'}`}>
      <TopNotification task={null} onClose={() => {}} />
      <Sidebar 
        userRole={props.userRole} 
        currentPage={props.currentPage} 
        setCurrentPage={props.setCurrentPage} 
        businessInfo={props.businessInfo} 
        theme={props.theme} 
        setTheme={props.setTheme} 
        isSidebarOpen={props.isSidebarOpen} 
        setIsSidebarOpen={props.setIsSidebarOpen} 
        setShowUserModal={props.setShowUserModal} 
        expandedMenus={props.expandedMenus} 
        toggleMenu={props.toggleMenu} 
        viewMode={props.viewMode} 
        setViewMode={props.setViewMode} 
        globalMonth={props.globalMonth} 
        setGlobalMonth={props.setGlobalMonth} 
        globalYear={props.globalYear} 
        setGlobalYear={props.setGlobalYear} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          setIsSidebarOpen={props.setIsSidebarOpen} 
          userRole={props.userRole} 
          businessInfo={props.businessInfo} 
          setShowUserModal={props.setShowUserModal} 
          setCurrentPage={props.setCurrentPage}
          syncStatus={props.syncStatus}
          tasks={props.tasks}
          inventoryItems={props.inventoryItems}
          maintenance={props.maintenance}
          bills={props.bills}
          reservations={props.reservations}
          articles={props.articles}
          expenses={props.expenses}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          {props.children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
