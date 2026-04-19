import { Router } from "express";
import {
    createOrgHandler,
    getOrgHandler,
    getOrgComponentsHandler,
} from "../controllers/organization.controller";

const router = Router();

router.post("/",              createOrgHandler);        // POST /organizations
router.get("/:id",            getOrgHandler);           // GET  /organizations/:id
router.get("/:id/components", getOrgComponentsHandler); // GET  /organizations/:id/components

export default router;
