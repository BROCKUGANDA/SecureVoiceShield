// OneSignal client-side integration for push notifications.
// Loaded lazily to keep initial bundle small.

export const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "";

export async function initOneSignal(userId?: string) {
  if (typeof window === "undefined" || !ONESIGNAL_APP_ID) return;
  try {
    // Dynamic import to avoid SSR issues.
    const OneSignal = (await import("react-onesignal")).default;
    await OneSignal.init({ appId: ONESIGNAL_APP_ID, allowLocalhostAsSecureOrigin: true });
    if (userId) {
      await OneSignal.login(userId);
    }
  } catch (e) {
    console.warn("OneSignal init failed:", e);
  }
}

export async function sendTag(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    const OneSignal = (await import("react-onesignal")).default;
    await OneSignal.User.addTag(key, value);
  } catch (e) {
    console.warn("OneSignal tag failed:", e);
  }
}