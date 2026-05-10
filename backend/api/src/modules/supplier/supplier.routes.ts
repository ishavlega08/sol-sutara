import { Router } from "express";
import {
    createSupplierHandler,
    getSuppliersHandler,
    getSupplierByIdHandler,
    updateSupplierHandler,
    updateSupplierStatusHandler,
    deleteSupplierHandler,
} from "./supplier.controller";
import { authenticateToken, requireOrg, requireRole } from "../../middleware/auth";

const router = Router();

// Read — VIEWER+
router.get("/",    authenticateToken, requireOrg, getSuppliersHandler);
router.get("/:id", authenticateToken, requireOrg, getSupplierByIdHandler);

// Create / update — MEMBER+
router.post("/",                authenticateToken, requireOrg, requireRole("MEMBER", "ADMIN", "OWNER"), createSupplierHandler);
router.patch("/:id",            authenticateToken, requireOrg, requireRole("MEMBER", "ADMIN", "OWNER"), updateSupplierHandler);
router.patch("/:id/status",     authenticateToken, requireOrg, requireRole("ADMIN", "OWNER"),           updateSupplierStatusHandler);

// Delete — OWNER only
router.delete("/:id",           authenticateToken, requireOrg, requireRole("OWNER"),                    deleteSupplierHandler);

export default router;
