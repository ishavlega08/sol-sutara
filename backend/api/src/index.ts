import "dotenv/config";
import "./utils/bigint";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import routes from "./routes";

const PORT    = process.env.PORT || 3001;
const ORIGINS = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000").split(",");

const app = express();

// Gzip compression — shrinks JSON responses by ~70%, zero risk for API usage
app.use(compression());

app.use(cors({
    origin:      ORIGINS,
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check — used by uptime monitors to keep the server warm (no auth, no data)
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use("/api", routes);

app.listen(PORT, () => {
    console.log(`Sol Sutara API running on port ${PORT}`);
});
