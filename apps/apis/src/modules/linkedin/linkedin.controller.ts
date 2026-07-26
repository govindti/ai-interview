import type { Request, Response } from "express";
import { scrapeLinkedIn, normalizeLinkedInUrl } from "./linkedin.scraper";

function statusForResponse(status: number): number {
  return Number.isInteger(status) && status >= 200 && status <= 599 ? status : 200;
}

function cleanHeaderValue(value: string): string {
  return value.replace(/[\r\n]/g, "");
}

export async function getLinkedInProfile(req: Request, res: Response) {
  try {
    const targetUrl = normalizeLinkedInUrl(req.query.url as string | null);
    const result = await scrapeLinkedIn(targetUrl);

    if (req.query.format === "html") {
      res.set({
        "content-type": "text/html; charset=utf-8",
        "x-linkedin-final-url": cleanHeaderValue(result.finalUrl),
      });
      return res.status(statusForResponse(result.status)).send(result.html);
    }

    return res.status(statusForResponse(result.status)).json(result);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to scrape LinkedIn",
    });
  }
}
