import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/store/storageKeys";

export interface ScheduleLocation {
  provinsi: string | null;
  kabkota: string | null;
}

const defaultLocation: ScheduleLocation = { provinsi: "DI Yogyakarta", kabkota: "Kabupaten Bantul" };
const STORAGE_KEY = STORAGE_KEYS.scheduleLocation;

export const useScheduleLocation = (initial?: Partial<ScheduleLocation>) => {
  const [location, setLocationState] = useState<ScheduleLocation>({ ...defaultLocation, ...initial });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as ScheduleLocation;
          setLocationState({ ...defaultLocation, ...parsed });
        }
      } catch (err) {
        console.warn("Failed to load schedule location", err);
      } finally {
        setHydrated(true);
      }
    };
    load();
  }, []);

  const persist = async (value: ScheduleLocation) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (err) {
      console.warn("Failed to save schedule location", err);
    }
  };

  const setLocation = (next: Partial<ScheduleLocation>) => {
    setLocationState((prev) => {
      const merged = { ...prev, ...next };
      persist(merged);
      return merged;
    });
  };

  const resetKabKota = () => {
    setLocation({ kabkota: null });
  };

  return { location, setLocation, hydrated, resetKabKota };
};
