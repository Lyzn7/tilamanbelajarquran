import { ImsakDay, ShalatDay } from "@/types/api";

export type EventItem = { label: string; time: Date };

const pad2 = (n: number) => n.toString().padStart(2, "0");

export const dateFromIsoAndHm = (iso: string, hm: string): Date => {
  const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
  const [h, min] = hm.split(":").map((x) => parseInt(x, 10));
  return new Date(y, m - 1, d, h, min, 0, 0);
};

const safeIsoFromTanggal = (tanggal: string): string => {
  // Prioritize YYYY-MM-DD
  const iso = tanggal.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  // Fallback DD/MM/YYYY or DD-MM-YYYY
  const dmy = tanggal.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${pad2(parseInt(m, 10))}-${pad2(parseInt(d, 10))}`;
  }
  // Fallback "11 Februari 2026" (Indonesian month names)
  const indoMonths: Record<string, number> = {
    januari: 1,
    februari: 2,
    maret: 3,
    april: 4,
    mei: 5,
    juni: 6,
    juli: 7,
    agustus: 8,
    september: 9,
    oktober: 10,
    november: 11,
    desember: 12
  };
  const dmyText = tanggal.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (dmyText) {
    const [, d, mon, y] = dmyText;
    const mNum = indoMonths[mon.toLowerCase()];
    if (mNum) return `${y}-${pad2(mNum)}-${pad2(parseInt(d, 10))}`;
  }
  return tanggal.trim();
};

export const normalizePrayerLabel = (label: string): string => {
  const key = label.trim().toLowerCase();
  const map: Record<string, string> = {
    zuhur: "Dzuhur",
    dzuhur: "Dzuhur",
    dhuhur: "Dzuhur",
    zuhr: "Dzuhur",
    asr: "Ashar",
    ashar: "Ashar",
    ashr: "Ashar",
    magrib: "Maghrib",
    maghrib: "Maghrib",
    isha: "Isya",
    isyak: "Isya",
    isya: "Isya",
    subuh: "Subuh",
    shubuh: "Subuh"
  };
  return map[key] ?? label.trim();
};

export const buildEventsFromImsak = (date: Date, day: ImsakDay): EventItem[] => [
  { label: "Imsak", time: new Date(date.getFullYear(), date.getMonth(), date.getDate(), ...day.imsak.split(":").map(Number), 0, 0) },
  { label: "Subuh", time: new Date(date.getFullYear(), date.getMonth(), date.getDate(), ...day.subuh.split(":").map(Number), 0, 0) },
  { label: "Terbit", time: new Date(date.getFullYear(), date.getMonth(), date.getDate(), ...day.terbit.split(":").map(Number), 0, 0) },
  { label: "Dhuha", time: new Date(date.getFullYear(), date.getMonth(), date.getDate(), ...day.dhuha.split(":").map(Number), 0, 0) },
  { label: "Dzuhur", time: new Date(date.getFullYear(), date.getMonth(), date.getDate(), ...day.dzuhur.split(":").map(Number), 0, 0) },
  { label: "Ashar", time: new Date(date.getFullYear(), date.getMonth(), date.getDate(), ...day.ashar.split(":").map(Number), 0, 0) },
  { label: "Maghrib", time: new Date(date.getFullYear(), date.getMonth(), date.getDate(), ...day.maghrib.split(":").map(Number), 0, 0) },
  { label: "Isya", time: new Date(date.getFullYear(), date.getMonth(), date.getDate(), ...day.isya.split(":").map(Number), 0, 0) }
].map((e) => ({ ...e, label: normalizePrayerLabel(e.label) }));

export const buildEventsFromShalat = (day: ShalatDay): EventItem[] => {
  const iso = safeIsoFromTanggal(day.tanggal_lengkap);
  const ensureValid = (dt: Date) => (isNaN(dt.getTime()) ? new Date() : dt);
  return [
    { label: "Subuh", time: ensureValid(dateFromIsoAndHm(iso, day.subuh)) },
    { label: "Terbit", time: ensureValid(dateFromIsoAndHm(iso, day.terbit)) },
    { label: "Dhuha", time: ensureValid(dateFromIsoAndHm(iso, day.dhuha)) },
    { label: "Dzuhur", time: ensureValid(dateFromIsoAndHm(iso, day.dzuhur)) },
    { label: "Ashar", time: ensureValid(dateFromIsoAndHm(iso, day.ashar)) },
    { label: "Maghrib", time: ensureValid(dateFromIsoAndHm(iso, day.maghrib)) },
    { label: "Isya", time: ensureValid(dateFromIsoAndHm(iso, day.isya)) }
  ].map((e) => ({ ...e, label: normalizePrayerLabel(e.label) }));
};

export const nextEvent = (events: EventItem[], nowMs: number = Date.now(), preferredLabels: string[] = []) => {
  const normalized = events.map((e) => ({ ...e, label: normalizePrayerLabel(e.label) }));
  const pool = preferredLabels.length
    ? normalized.filter((e) => preferredLabels.includes(e.label))
    : normalized;

  const pickEarliestFuture = (arr: EventItem[]) =>
    arr
      .filter((e) => e.time.getTime() > nowMs)
      .sort((a, b) => a.time.getTime() - b.time.getTime())[0];

  return pickEarliestFuture(pool) || pickEarliestFuture(normalized) || pool[0] || normalized[0] || null;
};

export const diffToHMS = (target: Date) => {
  const diff = Math.max(0, target.getTime() - Date.now());
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { hours, minutes, seconds };
};

export const formatHMS = (target: Date) => {
  const { hours, minutes, seconds } = diffToHMS(target);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};
