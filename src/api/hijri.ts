export type HijriDate = {
  day: number;
  month: { number: number; en: string; ar: string };
  year: number;
};

export type HijriCalendarDay = {
  gregorian: {
    date: string; // dd-mm-yyyy
    weekday: { en: string };
  };
  hijri: {
    day: string;
    month: { number: number; en: string; ar: string };
    year: string;
    holidays: string[];
  };
};

const API_BASE = "https://api.aladhan.com/v1";

const pad = (n: number) => n.toString().padStart(2, "0");

export const getHijriDate = async (date: Date): Promise<HijriDate> => {
  // Aladhan expects DD-MM-YYYY
  const d = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  const url = `${API_BASE}/gToH?date=${d}&adjustment=0&timezone=${encodeURIComponent("Asia/Jakarta")}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Hijri request failed: ${res.status}`);
  const json = await res.json();
  const hijri = json?.data?.hijri;
  if (!hijri) throw new Error("Hijri payload missing");
  return {
    day: Number(hijri.day),
    month: hijri.month,
    year: Number(hijri.year)
  };
};

export const getHijriCalendar = async (
  year: number,
  month: number,
  adjustment = -1,
  timezone = "Asia/Jakarta"
): Promise<HijriCalendarDay[]> => {
  const url = `${API_BASE}/hCalendar/${year}/${month}?adjustment=${adjustment}&timezone=${encodeURIComponent(timezone)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Hijri calendar request failed: ${res.status}`);
  const json = await res.json();
  if (!json?.data) throw new Error("Hijri calendar payload missing");
  return json.data as HijriCalendarDay[];
};
