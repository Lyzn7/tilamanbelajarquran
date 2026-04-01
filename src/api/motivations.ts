import motivationsData from "../data/motivations.json";

export interface Motivation {
  id: number;
  text: string;
  source: string;
}

/**
 * Mendapatkan kata motivasi berdasarkan hari (deterministic berdasarkan tanggal)
 * Sehingga pengguna mendapat motivasi yang sama untuk hari yang sama
 */
export const getDailyMotivation = (date: Date = new Date()): Motivation => {
  const day = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  const index = day % motivationsData.motivations.length;
  return motivationsData.motivations[index];
};

/**
 * Mendapatkan motivasi random
 */
export const getRandomMotivation = (): Motivation => {
  const index = Math.floor(Math.random() * motivationsData.motivations.length);
  return motivationsData.motivations[index];
};

/**
 * Mendapatkan semua motivasi
 */
export const getAllMotivations = (): Motivation[] => {
  return motivationsData.motivations;
};
