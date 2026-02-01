import axios from "axios";

const baseURL = process.env.EXPO_PUBLIC_BASE_URL || "https://equran.id/api/v2";

export const api = axios.create({
  baseURL,
  timeout: 15000
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Terjadi kesalahan jaringan";
    return Promise.reject(new Error(message));
  }
);
