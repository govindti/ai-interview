import { chromium, type Browser } from "playwright";

const DEFAULT_TARGET = "https://www.linkedin.com/";
const REQUEST_TIMEOUT_MS = Number(process.env.LINKEDIN_TIMEOUT_MS ?? 45_000);
const DEFAULT_DATAIMPULSE_HOST = "gw.dataimpulse.com";
const DEFAULT_DATAIMPULSE_PORT = "823";

function decodeUrlPart(value: string | undefined): string | undefined {
  if (!value) return undefined;

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getDataImpulseProxy() {
  const rawProxy =
    process.env.DATAIMPULSE_PROXY_URL ??
    process.env.DATAIMPULSE_PROXY_SERVER ??
    process.env.PROXY_URL;

  const proxySource = rawProxy
    ? rawProxy.includes("://")
      ? rawProxy
      : `http://${rawProxy}`
    : `http://${process.env.DATAIMPULSE_PROXY_HOST ?? DEFAULT_DATAIMPULSE_HOST}:${
        process.env.DATAIMPULSE_PROXY_PORT ?? DEFAULT_DATAIMPULSE_PORT
      }`;

  const proxyUrl = new URL(proxySource);

  const username =
    process.env.DATAIMPULSE_PROXY_USERNAME ??
    process.env.DATAIMPULSE_USERNAME ??
    process.env.PROXY_USERNAME ??
    decodeUrlPart(proxyUrl.username);

  const password =
    process.env.DATAIMPULSE_PROXY_PASSWORD ??
    process.env.DATAIMPULSE_PASSWORD ??
    process.env.PROXY_PASSWORD ??
    decodeUrlPart(proxyUrl.password);

  proxyUrl.username = "";
  proxyUrl.password = "";

  const proxy: { server: string; username?: string; password?: string } = {
    server: proxyUrl.toString().replace(/\/$/, ""),
  };

  if (username) proxy.username = username;
  if (password) proxy.password = password;

  if (!proxy.username || !proxy.password) {
    throw new Error(
      "Missing DataImpulse credentials. Set DATAIMPULSE_PROXY_USERNAME/DATAIMPULSE_PROXY_PASSWORD or DATAIMPULSE_PROXY_URL.",
    );
  }

  return proxy;
}

export function normalizeLinkedInUrl(value: string | null): string {
  const url = new URL(value || DEFAULT_TARGET);
  const hostname = url.hostname.toLowerCase();

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http and https URLs are supported");
  }

  if (hostname !== "linkedin.com" && !hostname.endsWith(".linkedin.com")) {
    throw new Error("Only linkedin.com URLs are allowed");
  }

  return url.toString();
}

export interface LinkedInScrapeResult {
  status: number;
  requestedUrl: string;
  finalUrl: string;
  title: string;
  html: string;
}

export async function scrapeLinkedIn(targetUrl: string): Promise<LinkedInScrapeResult> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: process.env.HEADLESS !== "false",
      proxy: getDataImpulseProxy(),
    });

    const context = await browser.newContext({
      locale: "en-US",
      userAgent:
        process.env.LINKEDIN_USER_AGENT ??
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();
    const response = await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: REQUEST_TIMEOUT_MS,
    });

    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

    return {
      status: response?.status() ?? 200,
      requestedUrl: targetUrl,
      finalUrl: page.url(),
      title: await page.title(),
      html: await page.content(),
    };
  } finally {
    await browser?.close();
  }
}
