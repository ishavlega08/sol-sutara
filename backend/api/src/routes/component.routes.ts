import { Router } from "express";
import {
    createComponentHandler,
    getComponentsHandler,
    getComponentByIdHandler,
    getChildrenHandler,
    linkComponentsHandler,
    getParentsHandler,
    getTraceHandler,
    getRecallHandler,
    getRiskHandler,
} from "../controllers/component.controller";
import { getEventsHandler, patchStatusHandler } from "../controllers/event.controller";
import { verifyComponentHandler } from "../controllers/verify.controller";
import { authenticateToken, requireOrg, requireRole } from "../middleware/auth";

const router = Router();

// Read — any authenticated org member (VIEWER+)
router.get("/",                 authenticateToken, requireOrg, getComponentsHandler);
router.get("/:id/children",     authenticateToken, requireOrg, getChildrenHandler);
router.get("/:id/parents",      authenticateToken, requireOrg, getParentsHandler);
router.get("/:id/trace",        authenticateToken, requireOrg, getTraceHandler);
router.get("/:id/affected",     authenticateToken, requireOrg, getRecallHandler);
router.get("/:id/risk",         authenticateToken, requireOrg, getRiskHandler);
router.get("/:id/events",       authenticateToken, requireOrg, getEventsHandler);
router.get("/:id/verify",       authenticateToken, requireOrg, verifyComponentHandler);
router.get("/:id",              authenticateToken, requireOrg, getComponentByIdHandler);

// Write — MEMBER, ADMIN, or OWNER
router.post("/",     authenticateToken, requireOrg, requireRole("MEMBER", "ADMIN", "OWNER"), createComponentHandler);
router.post("/link", authenticateToken, requireOrg, requireRole("MEMBER", "ADMIN", "OWNER"), linkComponentsHandler);

// Status lifecycle — MEMBER, ADMIN, or OWNER
router.patch("/:id/status", authenticateToken, requireOrg, requireRole("MEMBER", "ADMIN", "OWNER"), patchStatusHandler);

export default router;
