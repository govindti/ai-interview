import WebSocket from "ws";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";

export async function initSideband(callId: string, interviewId: string) {
  const url = `wss://api.openai.com/v1/realtime?call_id=${callId}`;

  const ws = new WebSocket(url, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_KEY}`,
    },
  });

  const interview = await prisma.interview.findFirst({
    where: { id: interviewId },
  });

  ws.on("open", () => {
    logger.info("Connected to OpenAI sideband", { callId, interviewId });

    ws.send(
      JSON.stringify({
        type: "session.update",
        session: {
          type: "realtime",
          instructions: `You are supposed to interview this user on their computer science intellect. Ask around 2-3 questions based
                        on their experience. Please use english only during the interview.
                        Here is everything about the users github, will give you a rough idea about what the user does -
                        ## Github metadata
                        ${interview?.githubMetadata}
                    `,
        },
      })
    );
  });

  ws.on("message", async (message) => {
    try {
      const parsed = JSON.parse(message.toString());

      if (parsed.type === "response.done") {
        let contents: { type: string; transcript: string }[] = [];
        parsed.response.output.map((x: any) => (contents = [...contents, ...x.content]));

        const assistantMessage = contents
          .filter((x) => x.type === "output_audio")
          .map((x) => x.transcript)
          .join(" ");

        await prisma.message.create({
          data: {
            interviewId,
            type: "Assistant",
            message: assistantMessage,
          },
        });

        logger.info("Saved assistant message", { interviewId });
      }
    } catch (err) {
      logger.error("Error processing sideband message", { error: err });
    }
  });

  ws.on("error", (err) => {
    logger.error("Sideband WebSocket error", { error: err.message, callId });
  });

  ws.on("close", (code, reason) => {
    logger.info("Sideband WebSocket closed", { callId, code, reason: reason.toString() });
  });
}
