import { Router } from "express";
import {
    createComponentHandler,
    getComponentsHandler,
    linkComponentsHandler,
    getParentsHandler,
} from "../controllers/component.controller";
import { authenticateToken, requireOrg, requireRole } from "../middleware/auth";

const router = Router();

// Read — any authenticated org member (VIEWER+)
router.get("/",            authenticateToken, requireOrg, getComponentsHandler);
router.get("/:id/parents", authenticateToken, requireOrg, getParentsHandler);

// Write — MEMBER, ADMIN, or OWNER
router.post("/",     authenticateToken, requireOrg, requireRole("MEMBER", "ADMIN", "OWNER"), createComponentHandler);
router.post("/link", authenticateToken, requireOrg, requireRole("MEMBER", "ADMIN", "OWNER"), linkComponentsHandler);

export default router;
