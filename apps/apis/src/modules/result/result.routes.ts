import { Router } from "express";
import { getResultHandler } from "./result.controller";
import { validate } from "../../middleware/validate";
import { interviewIdSchema } from "../interview/interview.validation";

const router = Router();

router.get(
  "/:interviewId",
  validate(interviewIdSchema, "params"),
  getResultHandler
);

export default router;
