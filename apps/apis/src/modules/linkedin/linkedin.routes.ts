import { Router } from "express";
import { getLinkedInProfile } from "./linkedin.controller";

const router = Router();

router.get("/", getLinkedInProfile);

export default router;
