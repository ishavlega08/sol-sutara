import "dotenv/config";
import "./utils/bigint";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes";

const PORT    = process.env.PORT || 3001;
const ORIGINS = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000").split(",");

const app = express();

app.use(cors({
    origin:      ORIGINS,
    credentials: true,             // required for httpOnly cookies
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api", routes);

app.listen(PORT, () => {
    console.log(`Sol Sutara API running on port ${PORT}`);
});
