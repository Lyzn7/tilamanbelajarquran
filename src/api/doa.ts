export type DoaItem = {
  id: number;
  title: string;
  arabic: string;
  latin?: string;
  translation?: string;
  source?: string;
};

import AsyncStorage from "@react-native-async-storage/async-storage";

type RawEquranDoaList = {
  id: number;
  nama: string;
  ar: string;
  tr: string;
  idn: string;
  tentang: string;
};

const CACHE_KEY_DOA = "@tilaman_doa_list";
const API_EQURAN = "https://equran.id/api/doa";
export const MAX_DOA_ID = 228; // sesuai dokumentasi equran.id

export const getDoaById = async (id: number): Promise<DoaItem> => {
  // Try taking from cached list first
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY_DOA);
    if (cached) {
      const list = JSON.parse(cached) as DoaItem[];
      const found = list.find((d) => d.id === id);
      if (found) return found;
    }
  } catch (e) {
    console.log("Error reading doa cache", e);
  }

  const res = await fetch(`${API_EQURAN}/${id}`);
  if (!res.ok) throw new Error(`Doa request failed: ${res.status}`);
  const json = (await res.json()) as RawEquranDoaList;
  return {
    id: json.id ?? id,
    title: (json as any).judul || json.nama,
    arabic: (json as any).arab || json.ar,
    latin: (json as any).latin || json.tr,
    translation: (json as any).indo || json.idn,
    source: (json as any).tentang || "equran.id"
  };
};

export const getAllDoa = async (): Promise<DoaItem[]> => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY_DOA);
    if (cached) {
      return JSON.parse(cached) as DoaItem[];
    }
  } catch (e) {
    console.log("Error reading cached doa list", e);
  }

  const res = await fetch(API_EQURAN);
  if (!res.ok) throw new Error(`Doa list request failed: ${res.status}`);
  const json = await res.json();
  const dataList: RawEquranDoaList[] = json.data || (Array.isArray(json) ? json : []);

  const results = dataList.map(item => ({
    id: item.id,
    title: item.nama,
    arabic: item.ar,
    latin: item.tr,
    translation: item.idn,
    source: item.tentang || "equran.id"
  }));

  try {
    await AsyncStorage.setItem(CACHE_KEY_DOA, JSON.stringify(results));
  } catch (e) {
    console.log("Error caching doa list", e);
  }

  return results;
};
