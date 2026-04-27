import { Router } from "express";
import {
    authenticateToken,
    requireOrgMembership,
    requireRole,
} from "../middleware/auth";
import {
    createOrgApiHandler,
    joinOrgHandler,
    getOrgApiHandler,
    getOrgMembersHandler,
    createInviteHandler,
    updateRoleHandler,
    removeMemberHandler,
    getInviteDetailsHandler,
} from "../controllers/orgMember.controller";

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
// Preview invite metadata without being logged in
router.get("/invite/:token", getInviteDetailsHandler);

// ── Authenticated, no org required ────────────────────────────────────────────
router.post("/",     authenticateToken, createOrgApiHandler);
router.post("/join", authenticateToken, joinOrgHandler);

// ── Org membership required ───────────────────────────────────────────────────
router.get("/:orgId",
    authenticateToken,
    requireOrgMembership,
    getOrgApiHandler
);

router.get("/:orgId/members",
    authenticateToken,
    requireOrgMembership,
    requireRole("ADMIN", "OWNER"),
    getOrgMembersHandler
);

router.post("/:orgId/invites",
    authenticateToken,
    requireOrgMembership,
    requireRole("ADMIN", "OWNER"),
    createInviteHandler
);

router.patch("/:orgId/members/:userId/role",
    authenticateToken,
    requireOrgMembership,
    requireRole("OWNER"),
    updateRoleHandler
);

router.delete("/:orgId/members/:userId",
    authenticateToken,
    requireOrgMembership,
    requireRole("ADMIN", "OWNER"),
    removeMemberHandler
);

export default router;
