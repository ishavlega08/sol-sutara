import "dotenv/config";
import "./utils/bigint";
import express from "express";
import cors from "cors";
import routes from "./routes";

const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api", routes);

app.listen(PORT, () => {
    console.log(`Sol Sutara API running on port ${PORT}`);
});