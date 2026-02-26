
import React, { useMemo } from 'react';
import { PageId, IncomeRecord, ExpenseRecord, TransferRecord, BusinessInfo, CategoryConfig } from '../types';
import ReportProfitLoss from './ReportProfitLoss';
import ReportAllocation from './ReportAllocation';
import ReportShareHub from './ReportShareHub';

interface Props {
  pageId: PageId;
  incomes: IncomeRecord[]; 
  expenses: ExpenseRecord[]; 
  allIncomes?: IncomeRecord[]; 
  allExpenses?: ExpenseRecord[]; 
  transfers?: TransferRecord[];
  wallets: string[];
  businessInfo: BusinessInfo;
  categories: CategoryConfig[];
  globalMonth: number;
  globalYear: number;
  viewMode?: 'BULANAN' | 'TAHUNAN';
  onNavigate?: (page: PageId) => void;
  setDbCategory?: (cat: string | null) => void;
}

const Reports: React.FC<Props> = ({ 
  pageId, incomes, expenses, allIncomes = [], allExpenses = [], transfers = [],
  businessInfo, categories, globalMonth, globalYear, viewMode = 'BULANAN', wallets,
  onNavigate, setDbCategory
}) => {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const periodLabel = viewMode === 'TAHUNAN' ? `Tahun ${globalYear}` : `${months[globalMonth]} ${globalYear}`;

  if (pageId === 'alokasi') {
     return <ReportAllocation expenses={expenses} categories={categories} periodLabel={periodLabel} onNavigate={onNavigate} setDbCategory={setDbCategory} />;
  }

  if (pageId === 'generate') {
    // 1. Rangkuman Laba Rugi periode terpilih
    const totalIncome = Math.round(incomes.reduce((sum, r) => sum + (Number(r.total) || 0), 0));
    const netRevenue = Math.round(totalIncome / 1.1);
    const opCategoryNames = categories.filter(c => c.isOperational).map(c => c.name.toLowerCase());
    const opExpenses = expenses.filter(e => opCategoryNames.includes(e.category.toLowerCase()));
    const totalOp = Math.round(opExpenses.reduce((sum, r) => sum + ((Number(r.amount) || 0) * (Number(r.qty) || 1)), 0));
    const nonOpExpenses = expenses.filter(e => !opCategoryNames.includes(e.category.toLowerCase()));
    const totalNonOp = Math.round(nonOpExpenses.reduce((sum, r) => sum + ((Number(r.amount) || 0) * (Number(r.qty) || 1)), 0));
    const opProfit = netRevenue - totalOp;
    const finalBalance = opProfit - totalNonOp;

    // 2. Kalkulasi Likuiditas Dompet (Global History Virtual Engine)
    const walletBalances: Record<string, number> = {};
    wallets.forEach(w => walletBalances[w] = 0);

    allIncomes.forEach(r => {
      if (walletBalances['Cash Naim'] !== undefined) walletBalances['Cash Naim'] += (Number(r.cashNaim) || 0);
      if (walletBalances['Cash Tiwi'] !== undefined) walletBalances['Cash Tiwi'] += (Number(r.cashTiwi) || 0);
      if (walletBalances['BRI'] !== undefined) walletBalances['BRI'] += (Number(r.bri) || 0);
      if (walletBalances['BNI'] !== undefined) walletBalances['BNI'] += (Number(r.bni) || 0);
    });

    allExpenses.forEach(r => { 
      const totalOut = (Number(r.amount) || 0) * (Number(r.qty) || 1);
      if (walletBalances[r.wallet] !== undefined) {
        walletBalances[r.wallet] -= totalOut;
      }
    });

    transfers.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (walletBalances[t.fromWallet] !== undefined) walletBalances[t.fromWallet] -= amt;
      if (walletBalances[t.toWallet] !== undefined) walletBalances[t.toWallet] += amt;
    });

    // Normalisasi akhir
    Object.keys(walletBalances).forEach(k => {
      walletBalances[k] = Math.round(walletBalances[k]);
    });

    return (
      <ReportShareHub 
        totalIncome={totalIncome} 
        netRevenue={netRevenue}
        totalOp={totalOp}
        opProfit={opProfit}
        finalBalance={finalBalance} 
        walletBalances={walletBalances}
        wallets={wallets}
        periodLabel={periodLabel} 
        businessInfo={businessInfo} 
      />
    );
  }

  // Fixed: Passed onNavigate to ReportProfitLoss
  return <ReportProfitLoss incomes={incomes} expenses={expenses} businessInfo={businessInfo} categories={categories} periodLabel={periodLabel} onNavigate={onNavigate} />;
};

export default Reports;
