import { Router } from "express";
import { createComponentHandler } from "../controllers/component.controller";

const router = Router();

router.post("/", createComponentHandler);

export default router;
