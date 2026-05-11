import "dotenv/config";
import "./utils/bigint";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import { globalLimiter } from "./middleware/rateLimit";
import routes from "./routes";

const PORT    = process.env.PORT || 3001;
const ORIGINS = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000").split(",");

const app = express();

// Trust proxy headers (X-Forwarded-For) when behind AWS ALB / Nginx
app.set("trust proxy", 1);

// Gzip compression — shrinks JSON responses by ~70%, zero risk for API usage
app.use(compression());

// CORS must be registered BEFORE the rate limiter so that 429 responses still
// carry the correct Access-Control-Allow-Origin header.  Without this, browsers
// report a CORS error instead of a rate-limit error, making the issue invisible.
const corsOptions: cors.CorsOptions = {
    origin:         ORIGINS,
    credentials:    true,
    methods:        ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
};
app.use(cors(corsOptions));

// Global rate limit — 500 req / 15 min per IP across all endpoints
app.use(globalLimiter);

app.use(express.json());
app.use(cookieParser());

// Health check — exempt from rate limiting (placed after global limiter intentionally;
// health checks are low-volume and the global window is generous enough)
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use("/api", routes);

app.listen(PORT, () => {
    console.log(`Sol Sutara API running on port ${PORT}`);
});
