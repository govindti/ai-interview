import { Router } from "express";
import { createSessionHandler } from "./session.controller";
import { validate } from "../../middleware/validate";
import { interviewIdSchema } from "../interview/interview.validation";

const router = Router();

router.post(
  "/:interviewId",
  validate(interviewIdSchema, "params"),
  createSessionHandler
);

export default router;
