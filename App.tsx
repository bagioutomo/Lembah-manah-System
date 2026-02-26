
import React from 'react';
import AuthGuard from './components/AuthGuard';
import MainLayout from './components/MainLayout';
import PageRouter from './components/PageRouter';
import UserModal from './components/UserModal';
import { storage } from './services/storageService';
import { useAppState } from './hooks/useAppState';
import { UserRole, PageId } from './types';

const App: React.FC = () => {
  const state = useAppState();
  
  const handleConfirmSwitchUser = (target: UserRole) => {
    const passwords = storage.getRolePasswords();
    const correctPin = (passwords[target] || "").toString().trim();
    if (correctPin !== "" && correctPin === state.passAttempt.trim()) {
      state.setUserRole(target); 
      storage.setUserRole(target); 
      state.setCurrentPage('dashboard'); 
      state.setShowUserModal(false); 
      state.setAuthTarget(null);
      state.setPassAttempt('');
    } else {
      alert("PIN KEAMANAN SALAH! Akses ditolak, Pak.");
      state.setPassAttempt('');
    }
  };

  // Logika Baru: Accordion Sidebar (Membuka satu akan menutup yang lain)
  const handleToggleMenu = (menuKey: string) => {
    state.setExpandedMenus((prev: Record<string, boolean>) => {
      const isCurrentlyOpen = prev[menuKey];
      // Jika sedang menutup, biarkan tertutup. Jika membuka, tutup semua yang lain.
      if (!isCurrentlyOpen) {
        return { [menuKey]: true };
      } else {
        return { ...prev, [menuKey]: false };
      }
    });
  };

  return (
    <div className={`min-h-screen ${state.theme === 'dark' ? 'dark bg-black' : 'bg-gray-50'}`}>
      <AuthGuard 
        userRole={state.userRole} 
        setUserRole={state.setUserRole} 
        isDataLoaded={state.isDataLoaded}
      >
        <MainLayout
          userRole={state.userRole!}
          currentPage={state.currentPage}
          setCurrentPage={state.setCurrentPage}
          businessInfo={state.businessInfo}
          theme={state.theme}
          setTheme={state.setTheme}
          isSidebarOpen={state.isSidebarOpen}
          setIsSidebarOpen={state.setIsSidebarOpen}
          setShowUserModal={state.setShowUserModal}
          expandedMenus={state.expandedMenus}
          toggleMenu={handleToggleMenu}
          viewMode={state.viewMode}
          setViewMode={state.setViewMode}
          globalMonth={state.globalMonth}
          setGlobalMonth={state.setGlobalMonth}
          globalYear={state.globalYear}
          setGlobalYear={state.setGlobalYear}
          syncStatus={state.syncStatus}
          tasks={state.tasks}
          inventoryItems={state.inventoryItems}
          maintenance={state.maintenance}
          bills={state.bills}
          reservations={state.reservations}
          articles={state.articles}
          expenses={state.expenses}
        >
          <PageRouter 
            currentPage={state.currentPage} 
            state={state} 
            handleNavigate={(p: PageId) => { state.setCurrentPage(p); state.setIsSidebarOpen(false); }}
          />
        </MainLayout>

        <UserModal 
          show={state.showUserModal} 
          onClose={() => state.setShowUserModal(false)} 
          userRole={state.userRole!} 
          authTarget={state.authTarget} 
          setAuthTarget={state.setAuthTarget} 
          passAttempt={state.passAttempt} 
          setPassAttempt={state.setPassAttempt} 
          confirmSwitchUser={handleConfirmSwitchUser} 
          onLogout={()=>{ storage.setUserRole(null); state.setUserRole(null); }} 
        />
      </AuthGuard>
    </div>
  );
};

export default App;
