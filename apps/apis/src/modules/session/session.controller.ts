import type { Request, Response } from "express";
import * as sessionService from "./session.service";
import { asyncHandler } from "../../lib/errors";

export const createSessionHandler = asyncHandler(async (req: Request, res: Response) => {
  const interviewId = String(req.params.interviewId);
  const sdpAnswer = await sessionService.createSession(interviewId, req.body);
  res.send(sdpAnswer);
});
