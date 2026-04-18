import "dotenv/config";
import express from "express";
import componentRoutes from "./routes/component.routes";
const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());

app.use("/components", componentRoutes);

app.listen(PORT, () => {
    console.log(`Sol Sutara API running on port ${PORT}`);
});