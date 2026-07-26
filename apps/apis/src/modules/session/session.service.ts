import { config } from "../../config";
import { ExternalServiceError } from "../../lib/errors";
import { initSideband } from "./sideband";
import { logger } from "../../lib/logger";

export async function createSession(interviewId: string, sdpOffer: string) {
  const sessionConfig = JSON.stringify({
    type: "realtime",
    model: "gpt-realtime",
    audio: { output: { voice: "marin" } },
  });

  const fd = new FormData();
  fd.set("sdp", sdpOffer);
  fd.set("session", sessionConfig);

  const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.OPENAI_KEY}`,
      "OpenAI-Safety-Identifier": "hashed-user-id",
    },
    body: fd,
  });

  if (!sdpResponse.ok) {
    const body = await sdpResponse.text();
    logger.error("OpenAI API error", { status: sdpResponse.status, body });
    throw new ExternalServiceError("OpenAI", `Failed to create session: ${sdpResponse.status}`);
  }

  const location = sdpResponse.headers.get("Location");
  const callId = location?.split("/").pop()!;
  logger.info("Session created", { callId, interviewId });

  initSideband(callId, interviewId);

  const sdpAnswer = await sdpResponse.text();
  return sdpAnswer;
}
