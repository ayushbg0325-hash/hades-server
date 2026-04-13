const FALLBACK_API_URL = "https://jonathan-celibatic-conner.ngrok-free.dev";

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || FALLBACK_API_URL).replace(/\/$/, "");
