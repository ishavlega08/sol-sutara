import { Router } from "express";
import componentRoutes    from "./component.routes";
import organizationRoutes from "./organization.routes";
import authRoutes         from "./auth.routes";
import orgsRoutes         from "./orgs.routes";
import analyticsRoutes    from "./analytics.routes";
import dashboardRoutes    from "./dashboard.routes";
import recallRoutes       from "./recall.routes";

// Phase 1: Core SCM modules
import supplierRoutes     from "../modules/supplier/supplier.routes";
import shipmentRoutes     from "../modules/shipment/shipment.routes";
import documentRoutes     from "../modules/document/document.routes";
import notificationRoutes from "../modules/notification/notification.routes";
import webhookRoutes      from "../modules/webhook/webhook.routes";

const router = Router();

// ── Existing routes ───────────────────────────────────────────────────────────
router.use("/auth",          authRoutes);
router.use("/orgs",          orgsRoutes);
router.use("/components",    componentRoutes);
router.use("/organizations", organizationRoutes);
router.use("/analytics",     analyticsRoutes);
router.use("/dashboard",     dashboardRoutes);
router.use("/recalls",       recallRoutes);

// ── Phase 1: Core SCM routes ──────────────────────────────────────────────────
router.use("/suppliers",     supplierRoutes);
router.use("/shipments",     shipmentRoutes);
router.use("/documents",     documentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/webhooks",      webhookRoutes);

export default router;
