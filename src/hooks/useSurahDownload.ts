import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Network from "expo-network";
import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/store/storageKeys";
import { SurahDetail } from "@/types/api";
import { useSettings } from "@/store/SettingsProvider";

type AudioMode = "full" | "ayat";

export interface SurahDownloadEntry {
  textCached?: boolean;
  audio?: Record<
    string,
    {
      full?: DownloadInfo;
      ayat?: DownloadInfo;
    }
  >;
  totalBytes?: number;
  lastUpdated?: number;
}

export interface DownloadInfo {
  files: string[];
  bytes: number;
  mode: AudioMode;
}

type Manifest = Record<number, SurahDownloadEntry>;

const SURAH_TEXT_KEY = (nomor: number) => `@tilaman/surah/${nomor}/text`;

export const useDownloadManifest = () => {
  const [manifest, setManifest] = useState<Manifest>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.downloadManifest);
        if (raw) setManifest(JSON.parse(raw));
      } finally {
        setReady(true);
      }
    };
    load();
  }, []);

  const persist = async (next: Manifest) => {
    setManifest(next);
    await AsyncStorage.setItem(STORAGE_KEYS.downloadManifest, JSON.stringify(next));
  };

  const remove = async (num: number) => {
    const next = { ...manifest };
    delete next[num];
    await FileSystem.deleteAsync(`${FileSystem.documentDirectory}surahs/${num}`, { idempotent: true });
    await AsyncStorage.removeItem(SURAH_TEXT_KEY(num));
    await persist(next);
  };

  return { manifest, ready, persist, remove };
};

export const deleteDownloadByNumber = async (num: number) => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.downloadManifest);
  const manifest: Manifest = raw ? JSON.parse(raw) : {};
  delete manifest[num];
  await FileSystem.deleteAsync(`${FileSystem.documentDirectory}surahs/${num}`, { idempotent: true });
  await AsyncStorage.removeItem(SURAH_TEXT_KEY(num));
  await AsyncStorage.setItem(STORAGE_KEYS.downloadManifest, JSON.stringify(manifest));
};

export const useSurahDownload = (nomor: number, data?: SurahDetail) => {
  const { manifest, ready, persist } = useDownloadManifest();
  const { settings } = useSettings();
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const entry = manifest[nomor];

  const ensureWifiOk = async () => {
    if (!settings.wifiOnlyDownload) return true;
    const state = await Network.getNetworkStateAsync();
    return state.type === Network.NetworkStateType.WIFI || state.type === Network.NetworkStateType.ETHERNET;
  };

  const saveManifestEntry = async (payload: Partial<SurahDownloadEntry>) => {
    const next = { ...manifest, [nomor]: { ...entry, ...payload, lastUpdated: Date.now() } };
    await persist(next);
  };

  const cacheText = async (detail: SurahDetail) => {
    await AsyncStorage.setItem(SURAH_TEXT_KEY(nomor), JSON.stringify(detail));
    await saveManifestEntry({ textCached: true });
  };

  const removeText = async () => {
    await AsyncStorage.removeItem(SURAH_TEXT_KEY(nomor));
    await saveManifestEntry({ textCached: false });
  };

  const downloadAudio = async (mode: AudioMode, qari: string, detail: SurahDetail) => {
    const ok = await ensureWifiOk();
    if (!ok) return;
    setDownloading(true);
    setProgress("Menyiapkan...");
    const dir = `${FileSystem.documentDirectory}surahs/${nomor}/audio-${qari}`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    let files: string[] = [];
    let bytes = 0;
    if (mode === "full") {
      const url = detail.audioFull[qari];
      const dest = `${dir}/full.mp3`;
      const res = await FileSystem.downloadAsync(url, dest);
      files.push(dest);
      bytes += res?.headers?.["content-length"] ? Number(res.headers["content-length"]) : res?.bytesWritten || 0;
    } else {
      for (const ayah of detail.ayat) {
        const url = ayah.audio[qari];
        const dest = `${dir}/${ayah.nomorAyat}.mp3`;
        setProgress(`Ayat ${ayah.nomorAyat}/${detail.ayat.length}`);
        const res = await FileSystem.downloadAsync(url, dest);
        files.push(dest);
        bytes += res?.headers?.["content-length"] ? Number(res.headers["content-length"]) : res?.bytesWritten || 0;
      }
    }
    const audioEntry = {
      ...(entry?.audio || {}),
      [qari]: {
        ...(entry?.audio?.[qari] || {}),
        [mode]: { files, bytes, mode }
      }
    };
    await saveManifestEntry({ audio: audioEntry, totalBytes: (entry?.totalBytes || 0) + bytes });
    setProgress(null);
    setDownloading(false);
  };

  const deleteAudio = async (qari?: string) => {
    setDownloading(true);
    const dirBase = `${FileSystem.documentDirectory}surahs/${nomor}`;
    await FileSystem.deleteAsync(dirBase, { idempotent: true });
    const nextAudio = qari && entry?.audio ? { ...entry.audio, [qari]: undefined } : undefined;
    const nextEntry: SurahDownloadEntry = {
      ...entry,
      audio: nextAudio,
      totalBytes: undefined
    };
    const next = { ...manifest, [nomor]: nextEntry };
    await persist(next);
    setDownloading(false);
  };

  const deleteAll = async () => {
    await removeText();
    await deleteAudio();
  };

  const getCachedText = async (): Promise<SurahDetail | null> => {
    const raw = await AsyncStorage.getItem(SURAH_TEXT_KEY(nomor));
    if (!raw) return null;
    return JSON.parse(raw) as SurahDetail;
  };

  return {
    manifest,
    entry,
    ready,
    downloading,
    progress,
    cacheText,
    getCachedText,
    downloadAudio,
    deleteAudio,
    deleteAll
  };
};
