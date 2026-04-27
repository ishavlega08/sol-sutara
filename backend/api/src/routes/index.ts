import { Router } from "express";
import componentRoutes    from "./component.routes";
import organizationRoutes from "./organization.routes";
import authRoutes         from "./auth.routes";
import orgsRoutes         from "./orgs.routes";

const router = Router();

router.use("/auth",          authRoutes);
router.use("/orgs",          orgsRoutes);
router.use("/components",    componentRoutes);
router.use("/organizations", organizationRoutes);

export default router;
