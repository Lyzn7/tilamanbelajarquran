export interface SurahSummary {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  audioFull?: Record<string, string>;
}

export interface SurahLink {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
}

export interface Ayah {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: Record<string, string>;
}

export interface SurahDetail extends SurahSummary {
  deskripsi: string;
  audioFull: Record<string, string>;
  ayat: Ayah[];
  suratSelanjutnya: SurahLink | false;
  suratSebelumnya: SurahLink | false;
}

export interface TafsirItem {
  ayat: number;
  teks: string;
}

export interface TafsirResponse {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  deskripsi: string;
  audioFull: Record<string, string>;
  tafsir: TafsirItem[];
  suratSelanjutnya: SurahLink | false;
  suratSebelumnya: SurahLink | false;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
