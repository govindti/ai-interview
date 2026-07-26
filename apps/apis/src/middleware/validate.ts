import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { BadRequestError } from "../lib/errors";

export function validate(schema: ZodSchema, source: "body" | "params" | "query" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      next(new BadRequestError(message));
      return;
    }
    req[source] = result.data;
    next();
  };
}
