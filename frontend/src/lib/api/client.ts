import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

const client = axios.create({
    baseURL:         BASE_URL,
    timeout:         10_000, // 10s — prevents auth hanging the UI indefinitely
    headers:         { "Content-Type": "application/json" },
    withCredentials: true,
});

// ── 401 → refresh → retry (once) ─────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

client.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error.config;

        // Skip the retry for the refresh endpoint itself to prevent loops
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes("/auth/refresh") &&
            !originalRequest.url?.includes("/auth/login")
        ) {
            originalRequest._retry = true;

            if (isRefreshing) {
                // Queue this request until the in-flight refresh completes
                return new Promise<void>((resolve) => {
                    refreshQueue.push(resolve);
                }).then(() => client(originalRequest));
            }

            isRefreshing = true;
            try {
                await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
                refreshQueue.forEach((resolve) => resolve());
                refreshQueue = [];
                return client(originalRequest);
            } catch {
                // Refresh failed — redirect to login
                refreshQueue = [];
                if (typeof window !== "undefined") {
                    window.location.href = "/login";
                }
                return Promise.reject(error);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default client;
