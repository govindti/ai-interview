import { z } from "zod";

export const preInterviewSchema = z.object({
  github: z.string().min(1, "GitHub URL is required"),
});

export const interviewIdSchema = z.object({
  interviewId: z.string().uuid("Invalid interview ID"),
});
