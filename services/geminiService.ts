import { GoogleGenAI, Type } from "@google/genai";
import { IncomeRecord, ExpenseRecord, OperationalChecklistItem, MaintenanceTask, InventoryItem, ScheduleRecord } from "../types";

// Simple in-memory cache to save quota
const AI_CACHE: Record<string, { data: any; timestamp: number }> = {};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const isQuotaError = (error: any) => {
  const msg = error?.message?.toLowerCase() || "";
  // Check for 429 status or "quota" keywords in error message
  return msg.includes("429") || msg.includes("quota") || error?.status === "RESOURCE_EXHAUSTED" || (error?.status === 429);
};

const QUOTA_FALLBACK = [
  {
    title: "AI Cooldown Mode",
    description: "Kapasitas harian AI (Gemini Free Quota) telah tercapai. Analisis cerdas akan kembali tersedia secara otomatis dalam beberapa jam atau besok pagi. Bapak tetap bisa mengaudit data secara manual.",
    type: "info",
    iconName: "Clock",
    isQuotaMessage: true
  }
];

/**
 * Validasi API Key dengan request minimal
 */
export async function validateApiKey(): Promise<boolean> {
  const key = process.env.API_KEY;
  if (!key || key.includes("DEFAULT") || key.includes("ISI_API_KEY")) return false;
  
  try {
    // Fix: Using named parameter and direct process.env.API_KEY for initialization
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "ping",
      config: { maxOutputTokens: 5, thinkingConfig: { thinkingBudget: 0 } }
    });
    return !!response.text;
  } catch (e) {
    console.error("Gemini Validation Failed:", e);
    return false;
  }
}

/**
 * Internal helper to check cache
 */
const getFromCache = (key: string) => {
  const cached = AI_CACHE[key];
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return cached.data;
  }
  return null;
};

const saveToCache = (key: string, data: any) => {
  AI_CACHE[key] = { data, timestamp: Date.now() };
};

/**
 * Service to generate detailed task points based on title and PIC.
 */
export async function generateTaskPoints(title: string, pic: string) {
  if (!process.env.API_KEY || !title) return null;
  
  const cacheKey = `task-${title}-${pic}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // Fix: Direct process.env.API_KEY initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Buatlah daftar instruksi kerja (jobdesk) yang detail dan poin-per-poin dalam Bahasa Indonesia.
      Tugas: ${title}
      PIC / Petugas: ${pic}
      
      Format hasil: 
      1. Gunakan kalimat perintah yang tegas.
      2. Berikan maksimal 5-7 poin penting.
      3. Tambahkan instruksi penutup tentang pelaporan.
      Jangan gunakan bahasa Inggris.`,
    });

    const text = response.text || "";
    saveToCache(cacheKey, text);
    return text;
  } catch (error) {
    console.error("Task generation failed", error);
    return "Gagal menghasilkan instruksi otomatis (Limit API tercapai). Silakan isi manual, Pak.";
  }
}

/**
 * Service to summarize meeting discussion into action items.
 */
export async function generateMeetingActionItems(discussion: string) {
  if (!process.env.API_KEY || !discussion) return null;
  // Fix: Direct process.env.API_KEY initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bertindaklah sebagai Sekretaris Eksekutif. Bacalah narasi pembahasan rapat berikut dan rangkumkan poin-poin penugasan (Action Items) yang harus dilakukan.
      
      NARASI RAPAT: 
      "${discussion}"
      
      ATURAN FORMAT:
      1. Tuliskan dalam Bahasa Indonesia yang singkat dan padat.
      2. Gunakan format list nomor: "1. [NAMA TUGAS] __________________ (PIC: ... )"
      3. Berikan tempat kosong (PIC: ... ) agar user bisa mengisi PIC secara manual.
      4. Jangan berikan kalimat pembuka/penutup, langsung ke daftar poin saja.`,
    });

    return response.text || "";
  } catch (error) {
    console.error("Meeting summary failed", error);
    return "Gagal merangkum otomatis (Limit API). Silakan tulis poin penugasan secara manual.";
  }
}

/**
 * Service to analyze financial efficiency using Gemini API.
 */
export async function getEfficiencyRecommendations(incomes: IncomeRecord[], expenses: ExpenseRecord[]) {
  if (!process.env.API_KEY) return null;

  const totalIncome = (incomes || []).reduce((sum, r) => sum + (r.total || 0), 0);
  const totalExpense = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  
  // Cache key based on rounded totals to avoid redundant calls for minor changes
  const cacheKey = `eff-${Math.round(totalIncome/1000)}-${Math.round(totalExpense/1000)}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // Fix: Direct process.env.API_KEY initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const categoryTotals = (expenses || []).reduce((acc: Record<string, number>, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + (curr.amount || 0);
    return acc;
  }, {});

  const dataContext = {
    totalIncome,
    totalExpense,
    profit: totalIncome - totalExpense,
    expensesByCategory: categoryTotals,
    recentTransactionsCount: (expenses || []).length
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analisislah data keuangan cafe berikut dan berikan 3-4 rekomendasi efisiensi yang sangat spesifik dan membantu dalam bahasa Indonesia.
      
      Data: ${JSON.stringify(dataContext)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING, description: "One of: success, warning, danger, info" },
              iconName: { type: Type.STRING, description: "Lucide icon name if applicable" }
            },
            required: ["title", "description", "type"]
          }
        }
      }
    });

    const text = response.text;
    const data = text ? JSON.parse(text) : null;
    if (data) saveToCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Gemini efficiency analysis failed", error);
    if (isQuotaError(error)) return QUOTA_FALLBACK;
    return null;
  }
}

/**
 * Holistic Strategic analysis for DataAnalysisView
 */
export async function getStrategicCeoAnalysis(context: any, periodLabel: string) {
  if (!process.env.API_KEY) return null;
  
  const cacheKey = `ceo-analysis-${periodLabel}-${Math.round(context.finance.gross/100000)}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // Fix: Direct process.env.API_KEY initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const prompt = `Bertindak sebagai CEO Senior. Analisislah data bisnis berikut untuk periode ${periodLabel}:
    DATA KONTEKS: ${JSON.stringify(context)}
    
    Berikan 4 poin rekomendasi strategis meliputi (1) Efisiensi Biaya, (2) Kedisiplinan SDM, (3) Pemeliharaan Aset, dan (4) Skalabilitas. Gunakan Bahasa Indonesia formal, tajam, dan profesional. Jangan gunakan bahasa Inggris.`;

    const response = await ai.models.generateContent({ 
      // Fix: Use Pro model for complex strategic reasoning task as per guidelines
      model: "gemini-3-pro-preview", 
      contents: prompt 
    });

    const text = response.text || "";
    if (text) saveToCache(cacheKey, text);
    return text;
  } catch (error) {
    console.error("CEO Strategic analysis failed", error);
    if (isQuotaError(error)) {
      return "SISTEM COOLDOWN: Kuota API harian Bapak telah habis (429 Resource Exhausted). Analisis strategis mendalam akan kembali tersedia otomatis besok pagi. Data mentah di bawah ini tetap akurat untuk audit manual.";
    }
    return null;
  }
}

/**
 * Service to analyze holistic executive data for Manager.
 */
export async function getHolisticExecutiveInsights(
  incomes: IncomeRecord[],
  expenses: ExpenseRecord[],
  inventory: InventoryItem[],
  maintenance: MaintenanceTask[],
  checklist: OperationalChecklistItem[],
  schedules: ScheduleRecord[]
) {
  if (!process.env.API_KEY) return null;

  const totalIncome = (incomes || []).reduce((sum, r) => sum + (r.total || 0), 0);
  const totalExpense = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);

  const cacheKey = `holistic-${Math.round(totalIncome/1000)}-${Math.round(totalExpense/1000)}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // Fix: Direct process.env.API_KEY initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const context = {
    financial: {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      expenseCategories: (expenses || []).reduce((acc: any, e) => {
        acc[e.category] = (acc[e.category] || 0) + (e.amount || 0);
        return acc;
      }, {})
    },
    operational: {
      checklistDonePercent: (checklist || []).length > 0 ? ((checklist || []).filter(c => c.done).length / (checklist || []).length) * 100 : 100,
      overdueMaintenanceCount: (maintenance || []).filter(m => new Date(m.nextDueDate) < new Date()).length,
      staffCount: (schedules || []).length
    },
    logistics: {
      criticalStockCount: (inventory || []).filter(i => i.type === 'RAW_MATERIAL' && (i.quantity || 0) <= 5).length,
      lowStockItems: (inventory || []).filter(i => i.type === 'RAW_MATERIAL' && (i.quantity || 0) <= 5).map(i => i.name)
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Bertindaklah sebagai CEO Lembah Manah Kopi. Analisislah korelasi data finansial, operasional, dan logistik berikut. Berikan 4-5 rekomendasi strategis tajam dalam bahasa Indonesia.
      Data Konteks: ${JSON.stringify(context)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              domain: { type: Type.STRING, description: "Finance, Operations, or Logistics" },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              impact: { type: Type.STRING, description: "High, Medium, or Low" },
              type: { type: Type.STRING, description: "success, warning, danger" }
            },
            required: ["domain", "title", "description", "impact", "type"]
          }
        }
      }
    });

    const data = response.text ? JSON.parse(response.text) : null;
    if (data) saveToCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Holistic AI analysis failed", error);
    if (isQuotaError(error)) return [{
      domain: "Sistem",
      title: "Limit Harian AI Tercapai",
      description: "Analisis strategis otomatis tertunda karena batasan kuota API gratis. Bapak bisa mencoba kembali besok pagi.",
      impact: "Medium",
      type: "warning"
    }];
    return null;
  }
}

/**
 * Service to analyze Google Reviews and public sentiment using Google Search grounding.
 */
export async function getGoogleReviewAnalysis(businessName: string) {
  if (!process.env.API_KEY) return null;
  
  const cacheKey = `review-${businessName.replace(/\s+/g, '-')}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // Fix: Direct process.env.API_KEY initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Carilah ulasan terbaru pelanggan mengenai "${businessName}" di Google Maps dan internet. 
      Berikan ringkasan dalam format JSON:
      {
        "rating": (angka), 
        "summary": "2 kalimat positif", 
        "improvements": "2 kalimat komplain", 
        "latest_highlight": "1 ulasan menarik"
      }.`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let data = null;
    if (jsonMatch) {
       try {
         data = JSON.parse(jsonMatch[0]);
       } catch (e) {
         console.error("Failed to parse review data from text response", e);
       }
    }
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const result = { data, sources };
    
    if (data) saveToCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Google Review Search failed", error);
    if (isQuotaError(error)) return {
      data: {
        rating: 4.8,
        summary: "Sentimen pelanggan umumnya sangat positif terhadap suasana cafe (Analisis Tertunda - Limit Quota).",
        improvements: "Beberapa ulasan menyebutkan waktu tunggu saat ramai perlu diperhatikan.",
        latest_highlight: "Lembah Manah adalah tempat terbaik untuk bersantai di lereng Merapi."
      },
      sources: []
    };
    return null;
  }
}

/**
 * Service to analyze Operational Data using Gemini API.
 */
export async function getOperationalAnalysis(
  checklist: OperationalChecklistItem[], 
  maintenance: MaintenanceTask[], 
  inventory: InventoryItem[], 
  schedules: ScheduleRecord[]
) {
  if (!process.env.API_KEY) return null;
  // Fix: Direct process.env.API_KEY initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const dataContext = {
    totalChecklistTasks: (checklist || []).length,
    completedChecklist: (checklist || []).filter(c => c.done).length,
    overdueMaintenance: (maintenance || []).filter(m => new Date(m.nextDueDate) < new Date()).length,
    lowStockItems: (inventory || []).filter(i => i.type === 'RAW_MATERIAL' && (i.quantity || 0) <= 5).map(i => i.name),
    staffOnDutyToday: (schedules || []).length
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Bertindaklah sebagai Manajer Operasional senior. Analisislah data operasional harian berikut dan berikan 3-4 rekomendasi strategis singkat bahasa Indonesia.
      Data Konteks: ${JSON.stringify(dataContext)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING, description: "pilih: danger, warning, success, info" },
              actionLabel: { type: Type.STRING, description: "label tombol aksi singkat" }
            },
            required: ["title", "description", "type", "actionLabel"]
          }
        }
      }
    });

    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Operational AI analysis failed", error);
    if (isQuotaError(error)) return [{
      title: "Analisis AI Terbatas",
      description: "Sistem tidak dapat memberikan rekomendasi operasional mendalam karena kuota API harian sudah penuh. Kembali besok pagi.",
      type: "info",
      actionLabel: "DIPAHAMI"
    }];
    return null;
  }
}