export type DoaItem = {
  id: number;
  title: string;
  arabic: string;
  latin?: string;
  translation?: string;
  source?: string;
};

type RawEquranDoa = {
  id: number;
  judul: string;
  arab: string;
  latin: string;
  indo: string;
};

const API_EQURAN = "https://equran.id/api/doa";
export const MAX_DOA_ID = 228; // sesuai dokumentasi equran.id

export const getDoaById = async (id: number): Promise<DoaItem> => {
  const res = await fetch(`${API_EQURAN}/${id}`);
  if (!res.ok) throw new Error(`Doa request failed: ${res.status}`);
  const json = (await res.json()) as RawEquranDoa;
  return {
    id: json.id ?? id,
    title: json.judul,
    arabic: json.arab,
    latin: json.latin,
    translation: json.indo,
    source: "equran.id"
  };
};
