export const queryKeys = {
  surahList: ["surah-list"] as const,
  surahDetail: (nomor: number) => ["surah-detail", nomor] as const,
  tafsir: (nomor: number) => ["tafsir", nomor] as const,
  imsakProvinsi: ["imsakiyah", "provinsi"] as const,
  imsakKabKota: (provinsi: string) => ["imsakiyah", "kabkota", provinsi] as const,
  imsakiyah: (provinsi: string, kabkota: string) => ["imsakiyah", provinsi, kabkota] as const,
  shalatProvinsi: ["shalat", "provinsi"] as const,
  shalatKabKota: (provinsi: string) => ["shalat", "kabkota", provinsi] as const,
  shalatSchedule: (provinsi: string, kabkota: string, bulan: number, tahun: number) =>
    ["shalat", provinsi, kabkota, bulan, tahun] as const,
  hijriToday: ["hijri", "today"] as const,
  hijriCalendar: (year: number, month: number) => ["hijri-calendar", year, month] as const,
  doaHarian: (id: number) => ["doa", "harian", id] as const,
  featureConfig: ["feature", "config"] as const
};
