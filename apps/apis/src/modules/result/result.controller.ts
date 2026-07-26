import type { Request, Response } from "express";
import * as resultService from "./result.service";
import { asyncHandler, NotFoundError } from "../../lib/errors";

export const getResultHandler = asyncHandler(async (req: Request, res: Response) => {
  const interviewId = String(req.params.interviewId);
  const result = await resultService.getResult(interviewId);

  if (!result) {
    throw new NotFoundError("Interview");
  }

  res.json(result);
});
