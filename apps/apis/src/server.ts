import { createServer } from "http";
import app from "./app";
import { config } from "./config";
import { prisma } from "@repo/db";
import { logger } from "./lib/logger";

const server = createServer(app);

function shutdown(signal: string) {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info("HTTP server closed");

    await prisma.$disconnect();
    logger.info("Database connection closed");

    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

server.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`, {
    env: config.NODE_ENV,
    port: config.PORT,
  });
});
