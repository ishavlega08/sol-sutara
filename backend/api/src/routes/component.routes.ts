import { Router } from "express";
import { createComponentHandler, getComponentsHandler } from "../controllers/component.controller";

const router = Router();

router.get("/", getComponentsHandler);
router.post("/", createComponentHandler);

export default router;
