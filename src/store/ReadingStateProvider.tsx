import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "./storageKeys";

export interface Bookmark {
  surah: number;
  ayah: number;
  surahName: string;
  arabic: string;
  translation?: string;
  timestamp: number;
}

export interface LastRead {
  surah: number;
  ayah: number;
  surahName: string;
  timestamp: number;
}

interface ReadingContextValue {
  bookmarks: Bookmark[];
  toggleBookmark: (item: Omit<Bookmark, "timestamp">) => void;
  isBookmarked: (surah: number, ayah: number) => boolean;
  lastRead?: LastRead;
  setLastRead: (value: Omit<LastRead, "timestamp">) => void;
  hydrated: boolean;
}

const ReadingStateContext = createContext<ReadingContextValue | undefined>(undefined);

export const ReadingStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [lastRead, setLastReadState] = useState<LastRead | undefined>(undefined);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [bmRaw, lastRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.bookmarks),
          AsyncStorage.getItem(STORAGE_KEYS.lastRead)
        ]);
        if (bmRaw) setBookmarks(JSON.parse(bmRaw));
        if (lastRaw) setLastReadState(JSON.parse(lastRaw));
      } catch (err) {
        console.warn("Failed to load reading state", err);
      } finally {
        setHydrated(true);
      }
    };
    load();
  }, []);

  const persistBookmarks = async (items: Bookmark[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(items));
    } catch (err) {
      console.warn("Persist bookmarks failed", err);
    }
  };

  const persistLastRead = async (value: LastRead | undefined) => {
    try {
      if (value) {
        await AsyncStorage.setItem(STORAGE_KEYS.lastRead, JSON.stringify(value));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.lastRead);
      }
    } catch (err) {
      console.warn("Persist last read failed", err);
    }
  };

  const toggleBookmark = (item: Omit<Bookmark, "timestamp">) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.surah === item.surah && b.ayah === item.ayah);
      const next = exists
        ? prev.filter((b) => !(b.surah === item.surah && b.ayah === item.ayah))
        : [...prev, { ...item, timestamp: Date.now() }];
      persistBookmarks(next);
      return next;
    });
  };

  const isBookmarked = (surah: number, ayah: number) =>
    bookmarks.some((b) => b.surah === surah && b.ayah === ayah);

  const setLastRead = (value: Omit<LastRead, "timestamp">) => {
    const payload = { ...value, timestamp: Date.now() };
    setLastReadState(payload);
    persistLastRead(payload);
  };

  const value = useMemo(
    () => ({
      bookmarks,
      toggleBookmark,
      isBookmarked,
      lastRead,
      setLastRead,
      hydrated
    }),
    [bookmarks, lastRead, hydrated]
  );

  return <ReadingStateContext.Provider value={value}>{children}</ReadingStateContext.Provider>;
};

export const useReadingState = () => {
  const ctx = useContext(ReadingStateContext);
  if (!ctx) throw new Error("useReadingState must be used within ReadingStateProvider");
  return ctx;
};
