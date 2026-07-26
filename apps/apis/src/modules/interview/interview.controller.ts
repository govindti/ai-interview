import type { Request, Response } from "express";
import * as interviewService from "./interview.service";
import { asyncHandler } from "../../lib/errors";

export const createInterviewHandler = asyncHandler(async (req: Request, res: Response) => {
  const { github } = req.body;
  const result = await interviewService.createInterview(github);
  res.status(201).json(result);
});

export const getUserMessageHandler = asyncHandler(async (req: Request, res: Response) => {
  const interviewId = String(req.params.interviewId);
  const { message } = req.body;
  await interviewService.saveUserMessage(interviewId, message);
  res.json({ message: "Message saved" });
});
