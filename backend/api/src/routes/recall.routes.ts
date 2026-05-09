import { Router } from "express";
import { createRecallHandler, getActiveRecallsHandler, resolveRecallHandler } from "../controllers/recall.controller";
import { authenticateToken, requireOrg, requireRole } from "../middleware/auth";

const router = Router();

router.get("/",                authenticateToken, requireOrg, getActiveRecallsHandler);
router.post("/",               authenticateToken, requireOrg, requireRole("MEMBER", "ADMIN", "OWNER"), createRecallHandler);
router.patch("/:id/resolve",   authenticateToken, requireOrg, requireRole("MEMBER", "ADMIN", "OWNER"), resolveRecallHandler);

export default router;
