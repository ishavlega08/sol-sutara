import { Router } from "express";
import { loginHandler, refreshHandler, logoutHandler, meHandler } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";

const router = Router();

router.post("/login",   authLimiter, loginHandler);
router.post("/refresh", authLimiter, refreshHandler);
router.post("/logout",  logoutHandler);

// Zero-DB session read — returns user/org/role from the JWT without any DB query
router.get("/me", authenticateToken, meHandler);

export default router;
