import { Router } from "express";
import {
    createComponentHandler,
    getComponentsHandler,
    linkComponentsHandler,
    getParentsHandler,
} from "../controllers/component.controller";

const router = Router();

router.get("/",              getComponentsHandler);
router.post("/",             createComponentHandler);
router.post("/link",         linkComponentsHandler);
router.get("/:id/parents",   getParentsHandler);

export default router;
