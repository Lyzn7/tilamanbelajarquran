import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/store/storageKeys";

export interface ScheduleLocation {
  provinsi: string | null;
  kabkota: string | null;
}

const defaultLocation: ScheduleLocation = { provinsi: "DI Yogyakarta", kabkota: "Kabupaten Bantul" };
const STORAGE_KEY = STORAGE_KEYS.scheduleLocation;
const listeners = new Set<(value: ScheduleLocation) => void>();
let currentLocation: ScheduleLocation = defaultLocation;
let currentHasStoredLocation = false;

const emitLocation = (value: ScheduleLocation) => {
  currentLocation = value;
  listeners.forEach((listener) => listener(value));
};

export const useScheduleLocation = (initial?: Partial<ScheduleLocation>) => {
  const [location, setLocationState] = useState<ScheduleLocation>({ ...currentLocation, ...initial });
  const [hydrated, setHydrated] = useState(false);
  const [hasStoredLocation, setHasStoredLocation] = useState(currentHasStoredLocation);

  useEffect(() => {
    const listener = (value: ScheduleLocation) => setLocationState(value);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as ScheduleLocation;
          const next = { ...defaultLocation, ...parsed };
          emitLocation(next);
          currentHasStoredLocation = true;
          setHasStoredLocation(true);
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
      currentHasStoredLocation = true;
      setHasStoredLocation(true);
      emitLocation(merged);
      return merged;
    });
  };

  const resetKabKota = () => {
    setLocation({ kabkota: null });
  };

  return { location, setLocation, hydrated, hasStoredLocation, resetKabKota };
};
