import { Router } from "express";
import componentRoutes    from "./component.routes";
import organizationRoutes from "./organization.routes";

const router = Router();

router.use("/components",    componentRoutes);
router.use("/organizations", organizationRoutes);

export default router;