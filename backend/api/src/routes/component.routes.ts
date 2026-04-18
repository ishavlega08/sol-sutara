import { Router } from "express";
import {
    createComponentHandler,
    linkComponentsHandler,
    getParentsHandler,
} from "../controllers/component.controller";

const router = Router();

router.post("/",           createComponentHandler);
router.post("/link",       linkComponentsHandler);
router.get("/:id/parents", getParentsHandler);

export default router;
