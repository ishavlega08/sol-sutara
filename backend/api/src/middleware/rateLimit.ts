import rateLimit from "express-rate-limit";

function json429(message: string) {
    return (_req: unknown, res: { status: (n: number) => { json: (b: object) => void } }) => {
        res.status(429).json({ success: false, error: message });
    };
}

// Auth endpoints — strictest: 15 attempts per 15 minutes per IP
// Prevents credential brute-force and token-spray attacks.
export const authLimiter = rateLimit({
    windowMs:         15 * 60 * 1000,
    limit:            15,
    standardHeaders:  "draft-7",
    legacyHeaders:    false,
    handler:          json429("Too many authentication attempts. Please wait 15 minutes and try again."),
});

// Write endpoints (POST/PATCH/PUT/DELETE on data) — 60 per minute per IP
// Prevents automated component/supplier/shipment flooding.
export const writeLimiter = rateLimit({
    windowMs:         60 * 1000,
    limit:            60,
    standardHeaders:  "draft-7",
    legacyHeaders:    false,
    handler:          json429("Too many write requests. Please slow down."),
});

// Read endpoints (GET on data) — 200 per minute per IP
export const readLimiter = rateLimit({
    windowMs:         60 * 1000,
    limit:            200,
    standardHeaders:  "draft-7",
    legacyHeaders:    false,
    handler:          json429("Too many requests. Please slow down."),
});

// Global fallback — 500 requests per 15 minutes per IP
// Catches anything not covered by the specific limiters above.
export const globalLimiter = rateLimit({
    windowMs:         15 * 60 * 1000,
    limit:            500,
    standardHeaders:  "draft-7",
    legacyHeaders:    false,
    handler:          json429("Rate limit exceeded. Please try again later."),
});
