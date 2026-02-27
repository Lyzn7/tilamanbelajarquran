import { api } from "./client";
import {
  ApiResponse,
  ImsakiyahResponse,
  ShalatResponse,
  SurahDetail,
  SurahSummary,
  TafsirResponse
} from "@/types/api";

export const getSurahList = async (): Promise<SurahSummary[]> => {
  const res = await api.get<ApiResponse<SurahSummary[]>>("/surat");
  return res.data.data;
};

export const getSurahDetail = async (nomor: number): Promise<SurahDetail> => {
  const res = await api.get<ApiResponse<SurahDetail>>(`/surat/${nomor}`);
  return res.data.data;
};

export const getTafsir = async (nomor: number): Promise<TafsirResponse> => {
  const res = await api.get<ApiResponse<TafsirResponse>>(`/tafsir/${nomor}`);
  return res.data.data;
};

export const getImsakProvinsi = async (): Promise<string[]> => {
  const res = await api.get<ApiResponse<string[]>>("/imsakiyah/provinsi");
  return res.data.data;
};

export const getImsakKabKota = async (provinsi: string): Promise<string[]> => {
  const res = await api.post<ApiResponse<string[]>>("/imsakiyah/kabkota", { provinsi });
  return res.data.data;
};

export const getImsakiyah = async (provinsi: string, kabkota: string): Promise<ImsakiyahResponse> => {
  const res = await api.post<ApiResponse<ImsakiyahResponse>>("/imsakiyah", { provinsi, kabkota });
  return res.data.data;
};

export const getShalatProvinsi = async (): Promise<string[]> => {
  const res = await api.get<ApiResponse<string[]>>("/shalat/provinsi");
  return res.data.data;
};

export const getShalatKabKota = async (provinsi: string): Promise<string[]> => {
  const res = await api.post<ApiResponse<string[]>>("/shalat/kabkota", { provinsi });
  return res.data.data;
};

export const getShalatSchedule = async (
  provinsi: string,
  kabkota: string,
  bulan: number,
  tahun: number
): Promise<ShalatResponse> => {
  const res = await api.post<ApiResponse<ShalatResponse>>("/shalat", { provinsi, kabkota, bulan, tahun });
  return res.data.data;
};

type VectorPayload = { cari: string; batas?: number; tipe?: string[]; skorMin?: number };
type VectorItem = any;

export const vectorSearch = async (payload: VectorPayload): Promise<VectorItem[]> => {
  const url = "https://equran.id/api/vector"; // vector endpoint berada di root, bukan /v2
  const res = await api.post(url, payload, { baseURL: undefined }); // hindari prefix baseURL v2
  return res.data?.hasil ?? res.data?.data ?? [];
};
