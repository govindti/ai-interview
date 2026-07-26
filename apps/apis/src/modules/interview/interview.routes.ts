import { Router } from "express";
import { createInterviewHandler, getUserMessageHandler } from "./interview.controller";
import { validate } from "../../middleware/validate";
import { preInterviewSchema, interviewIdSchema } from "./interview.validation";

const router = Router();

router.post(
  "/",
  validate(preInterviewSchema),
  createInterviewHandler
);

router.post(
  "/:interviewId/message",
  validate(interviewIdSchema, "params"),
  getUserMessageHandler
);

export default router;
