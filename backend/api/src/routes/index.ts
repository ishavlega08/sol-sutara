import { Router } from "express";
import componentRoutes from "./component.routes";

const router = Router();

router.use("/components", componentRoutes);

export default router;