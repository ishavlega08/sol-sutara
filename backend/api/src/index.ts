import express from "express";
import dotenv from "dotenv";
import componentRoutes from "./routes/component.routes";

dotenv.config();
const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());

app.use("/components", componentRoutes);

app.listen(PORT, () => {
    console.log(`Sol Sutara API running on port ${PORT}`);
});