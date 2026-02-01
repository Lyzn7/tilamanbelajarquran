export const queryKeys = {
  surahList: ["surah-list"] as const,
  surahDetail: (nomor: number) => ["surah-detail", nomor] as const,
  tafsir: (nomor: number) => ["tafsir", nomor] as const
};
