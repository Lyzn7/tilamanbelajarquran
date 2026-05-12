import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const KEY = "chatbot_usage";
const DAILY_LIMIT = 5;
const REWARD_AMOUNT = 5;

interface Usage {
  date: string;
  count: number;
  rewardCount?: number;
}

const today = () => new Date().toISOString().slice(0, 10);

const getRemaining = (usage: Usage) =>
  Math.max(0, DAILY_LIMIT + (usage.rewardCount ?? 0) - usage.count);

export const useChatLimit = () => {
  const [remaining, setRemaining] = useState(DAILY_LIMIT);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const usage: Usage = JSON.parse(raw);
        if (usage.date === today()) {
          setRemaining(getRemaining(usage));
        } else {
          await AsyncStorage.setItem(
            KEY,
            JSON.stringify({ date: today(), count: 0, rewardCount: 0 }),
          );
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

  useEffect(() => {
    load();
  }, [load]);

  const increment = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const usage: Usage = raw
        ? JSON.parse(raw)
        : { date: today(), count: 0, rewardCount: 0 };
      const nextUsage: Usage = {
        date: today(),
        count: usage.date === today() ? usage.count + 1 : 1,
        rewardCount: usage.date === today() ? usage.rewardCount ?? 0 : 0,
      };
      await AsyncStorage.setItem(KEY, JSON.stringify(nextUsage));
      setRemaining(getRemaining(nextUsage));
    } catch {
      // silent
    }
  }, []);

  const grantReward = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const usage: Usage = raw
        ? JSON.parse(raw)
        : { date: today(), count: 0, rewardCount: 0 };
      const nextUsage: Usage = {
        date: today(),
        count: usage.date === today() ? usage.count : 0,
        rewardCount:
          (usage.date === today() ? usage.rewardCount ?? 0 : 0) +
          REWARD_AMOUNT,
      };
      await AsyncStorage.setItem(KEY, JSON.stringify(nextUsage));
      setRemaining(getRemaining(nextUsage));
    } catch {
      // silent
    }
  }, []);

  return {
    remaining,
    canSend: remaining > 0,
    increment,
    grantReward,
    loaded,
    limit: DAILY_LIMIT,
    rewardAmount: REWARD_AMOUNT,
  };
};
