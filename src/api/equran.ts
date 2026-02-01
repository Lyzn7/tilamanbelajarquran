import { api } from "./client";
import { ApiResponse, SurahDetail, SurahSummary, TafsirResponse } from "@/types/api";

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
