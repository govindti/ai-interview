import * as z from "zod";
import { GoogleGenAI } from "@google/genai";
import { config } from "../../config";
import { prisma } from "@repo/db";
import { logger } from "../../lib/logger";

const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

const outputSchema = z.object({
  feedback: z.string().describe("Feedback for the user"),
  score: z.number().int().describe("Score out of 10 for their interview"),
});

const RESULT_PROMPT = `
    You are an expert evaluator. Your job is to evaluate the users interview. Give them a score out of 10
    and also let them know any feedback you have about thier interview.

    Please return only a json which looks like this -
    {
        feedback: string,
        score: number
    }

    DO NOT RETURN ANY OTHER TEXT
    {{USER_TRANSCRIPT}}
`;

async function calculateResult(messages: { type: "Assistant" | "User"; message: string; createdAt: Date }[]) {
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: RESULT_PROMPT.replace("{{USER_TRANSCRIPT}}", JSON.stringify(messages)),
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(outputSchema),
    },
  });

  logger.info("Gemini evaluation complete");
  const result = outputSchema.parse(JSON.parse(response.text!));
  return result;
}

export async function getResult(interviewId: string) {
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId },
    include: { conversations: true },
  });

  if (!interview) {
    return null;
  }

  const response = {
    score: interview.score,
    feedback: interview.feedback,
    transcript: interview.conversations.map((c: any) => ({
      type: c.type,
      content: c.message,
      createdAt: c.createdAt,
    })),
    status: interview.status,
  };

  if (interview.status !== "Done") {
    const result = await calculateResult(interview.conversations);

    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: "Done",
        feedback: result.feedback,
        score: result.score,
      },
    });

    response.score = result.score;
    response.feedback = result.feedback;
    response.status = "Done";
  }

  return response;
}
