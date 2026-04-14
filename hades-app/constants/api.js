import Constants from "expo-constants";

const isLocalWeb =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const expoHost =
  Constants.expoConfig?.hostUri ||
  Constants.expoGoConfig?.debuggerHost ||
  "";

const deviceHost = expoHost ? expoHost.split(":")[0] : "";

const FALLBACK_API_URL = isLocalWeb
  ? "http://localhost:3000"
  : deviceHost
    ? `http://${deviceHost}:3000`
    : "http://172.36.1.112:3000";

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || FALLBACK_API_URL).replace(/\/$/, "");
