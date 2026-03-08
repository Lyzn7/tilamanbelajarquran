import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const KEY = "chatbot_usage";
const DAILY_LIMIT = 5;

interface Usage {
  date: string;
  count: number;
}

const today = () => new Date().toISOString().slice(0, 10); // "2026-03-08"

export const useChatLimit = () => {
  const [remaining, setRemaining] = useState(DAILY_LIMIT);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const usage: Usage = JSON.parse(raw);
        if (usage.date === today()) {
          setRemaining(Math.max(0, DAILY_LIMIT - usage.count));
        } else {
          // Hari baru — reset
          await AsyncStorage.setItem(KEY, JSON.stringify({ date: today(), count: 0 }));
          setRemaining(DAILY_LIMIT);
        }
      } else {
        setRemaining(DAILY_LIMIT);
      }
    } catch {
      setRemaining(DAILY_LIMIT);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const increment = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const usage: Usage = raw ? JSON.parse(raw) : { date: today(), count: 0 };
      const newCount = usage.date === today() ? usage.count + 1 : 1;
      await AsyncStorage.setItem(KEY, JSON.stringify({ date: today(), count: newCount }));
      setRemaining(Math.max(0, DAILY_LIMIT - newCount));
    } catch {
      // silent
    }
  }, []);

  return {
    remaining,
    canSend: remaining > 0,
    increment,
    loaded,
    limit: DAILY_LIMIT,
  };
};
