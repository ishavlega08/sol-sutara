import { Router } from "express";
import componentRoutes    from "./component.routes";
import organizationRoutes from "./organization.routes";
import authRoutes         from "./auth.routes";
import orgsRoutes         from "./orgs.routes";
import analyticsRoutes    from "./analytics.routes";
import dashboardRoutes    from "./dashboard.routes";
import recallRoutes       from "./recall.routes";

const router = Router();

router.use("/auth",          authRoutes);
router.use("/orgs",          orgsRoutes);
router.use("/components",    componentRoutes);
router.use("/organizations", organizationRoutes);
router.use("/analytics",     analyticsRoutes);
router.use("/dashboard",     dashboardRoutes);
router.use("/recalls",       recallRoutes);

export default router;
