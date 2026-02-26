
import { CategoryConfig } from './types';

export const DEFAULT_WALLETS = ['BRI', 'BNI', 'Cash Naim', 'Pajak & Service', 'Purchasing', 'Supervisor'];

export const CATEGORY_GROUPS = [
  {
    name: 'SDM & Gaji',
    subs: ['Gaji Pokok', 'Gaji Part-time', 'Overtime', 'Service Charge', 'Bonus Target', 'Sisa Cuti', 'Cash Bon & Piutang']
  },
  {
    name: 'Bahan Baku',
    subs: ['Bahan Baku Bar', 'Bahan Baku Kitchen']
  },
  {
    name: 'Utilitas',
    subs: ['Listrik', 'Internet', 'Gas', 'Air Tandon', 'Air Galon']
  },
  {
    name: 'Operasional',
    subs: ['Konsumsi', 'Biaya Pemeliharaan', 'Perlengkapan', 'Akomodasi', 'Purchasing', 'Pengadaan Barang']
  },
  {
    name: 'Marketing & Entertain',
    subs: ['Live Music', 'Entertain', 'Promosi']
  },
  {
    name: 'Investasi & Pajak',
    subs: ['Investasi', 'Pengeluaran Pajak', 'Prive']
  },
  {
    name: 'Lainnya',
    subs: ['Lain-lain']
  }
];

// Sub-Kategori untuk HPP Menu
export const HPP_SUB_CATEGORIES = {
  BEVERAGE: ['COFFEE', 'JUICE', 'TEA', 'NON-COFFEE', 'MOCKTAIL', 'BLENDED'],
  FOOD: ['MAIN COURSE', 'SNACK', 'DESSERT', 'PASTRY', 'ADDITIONAL']
};

// Kategori yang dianggap sebagai Alokasi Laba (Non-Operasional)
const NON_OP_SUBS = ['Investasi', 'Prive', 'Cash Bon & Piutang', 'Pengeluaran Pajak'];

export const DEFAULT_CATEGORIES: CategoryConfig[] = CATEGORY_GROUPS.flatMap(group => 
  group.subs.map(sub => ({
    name: sub,
    isOperational: !NON_OP_SUBS.includes(sub)
  }))
);

export const COLORS = {
  primary: '#166534',
  secondary: '#14532d',
  accent: '#16a34a',
  chart: ['#166534', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7']
};
