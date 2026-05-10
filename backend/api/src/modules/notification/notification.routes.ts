import { Router } from "express";
import {
    getNotificationsHandler,
    getUnreadCountHandler,
    markReadHandler,
    markAllReadHandler,
} from "./notification.controller";
import { authenticateToken, requireOrg } from "../../middleware/auth";

const router = Router();

router.get("/",                   authenticateToken, requireOrg, getNotificationsHandler);
router.get("/unread-count",       authenticateToken, requireOrg, getUnreadCountHandler);
router.post("/mark-all-read",     authenticateToken, requireOrg, markAllReadHandler);
router.patch("/:id/read",         authenticateToken, requireOrg, markReadHandler);

export default router;
