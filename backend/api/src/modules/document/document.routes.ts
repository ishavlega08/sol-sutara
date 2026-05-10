import { Router } from "express";
import {
    createDocumentHandler,
    getDocumentsHandler,
    getDocumentByIdHandler,
    deleteDocumentHandler,
} from "./document.controller";
import { authenticateToken, requireOrg, requireRole } from "../../middleware/auth";

const router = Router();

// Read — VIEWER+
router.get("/",    authenticateToken, requireOrg, getDocumentsHandler);
router.get("/:id", authenticateToken, requireOrg, getDocumentByIdHandler);

// Upload — MEMBER+
router.post("/",   authenticateToken, requireOrg, requireRole("MEMBER", "ADMIN", "OWNER"), createDocumentHandler);

// Delete — ADMIN+
router.delete("/:id", authenticateToken, requireOrg, requireRole("ADMIN", "OWNER"), deleteDocumentHandler);

export default router;
