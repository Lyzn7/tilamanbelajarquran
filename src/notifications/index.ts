import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@tilaman/alarms/v1";

export type AlarmScheduleInput = {
  imsakDate?: Date | null;
  maghribDate?: Date | null;
  imsakEnabled: boolean;
  maghribEnabled: boolean;
  imsakOffsetMinutes?: number;
  maghribOffsetMinutes?: number;
};

type StoredIds = {
  imsakId?: string;
  maghribId?: string;
};

const withOffset = (date: Date, offsetMinutes: number | undefined) => {
  if (!offsetMinutes) return date;
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + offsetMinutes);
  return d;
};

export const setupNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false
    })
  });
};

export const requestNotificationPermission = async () => {
  const perms = await Notifications.getPermissionsAsync();
  if (perms.status === "granted") return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === "granted";
};

export const clearAlarmNotifications = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredIds;
      if (parsed.imsakId) await Notifications.cancelScheduledNotificationAsync(parsed.imsakId);
      if (parsed.maghribId) await Notifications.cancelScheduledNotificationAsync(parsed.maghribId);
    }
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("Failed clearing alarms", err);
  }
};

export const scheduleAlarmNotifications = async (input: AlarmScheduleInput) => {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  await clearAlarmNotifications();
  const stored: StoredIds = {};

  if (input.imsakEnabled && input.imsakDate) {
    const date = withOffset(input.imsakDate, input.imsakOffsetMinutes);
    if (date.getTime() > Date.now()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: "Pengingat Imsak", body: "Waktu imsak tiba.", sound: true },
        trigger: date
      });
      stored.imsakId = id;
    }
  }

  if (input.maghribEnabled && input.maghribDate) {
    const date = withOffset(input.maghribDate, input.maghribOffsetMinutes);
    if (date.getTime() > Date.now()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: "Pengingat Maghrib", body: "Waktu maghrib tiba.", sound: true },
        trigger: date
      });
      stored.maghribId = id;
    }
  }

  if (stored.imsakId || stored.maghribId) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }
};

