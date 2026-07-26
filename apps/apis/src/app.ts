import express from "express";
import cors from "cors";

import { requestLogger } from "./middleware/request-logger";
import { errorHandler } from "./middleware/error-handler";
import { notFound } from "./middleware/not-found";

import interviewRoutes from "./modules/interview/interview.routes";
import sessionRoutes from "./modules/session/session.routes";
import resultRoutes from "./modules/result/result.routes";
import linkedinRoutes from "./modules/linkedin/linkedin.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.text({ type: ["application/sdp", "text/plain"] }));
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/interview", interviewRoutes);
app.use("/api/v1/session", sessionRoutes);
app.use("/api/v1/result", resultRoutes);
app.use("/api/v1/linkedin", linkedinRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
