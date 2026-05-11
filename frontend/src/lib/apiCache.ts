// Lightweight in-memory SWR-style cache for API responses.
// Eliminates re-fetching on every page navigation — returns stale data
// immediately while refreshing in the background.

interface Entry<T> { data: T; at: number; }
const store = new Map<string, Entry<unknown>>();

export function cacheGet<T>(key: string, maxAgeMs: number): T | null {
    const e = store.get(key) as Entry<T> | undefined;
    if (!e) return null;
    if (Date.now() - e.at > maxAgeMs) { store.delete(key); return null; }
    return e.data;
}

export function cacheSet<T>(key: string, data: T): void {
    store.set(key, { data, at: Date.now() });
}

export function cacheInvalidate(prefix: string): void {
    for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key);
    }
}

// TTL presets (ms)
export const TTL = {
    short:  15_000,   // 15s — live counts, notifications
    medium: 30_000,   // 30s — lists (components, shipments, suppliers)
    long:   120_000,  // 2m  — analytics, dashboard stats
    static: 300_000,  // 5m  — plan catalogue, org info
} as const;
