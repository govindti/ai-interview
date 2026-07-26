import * as z from "zod";
import { GoogleGenAI } from "@google/genai";
import { config } from "../../config";
import { prisma } from "@repo/db";
import { logger } from "../../lib/logger";

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

type EvaluationResult = z.infer<typeof outputSchema>;

async function evaluateWithGemini(messages: { type: "Assistant" | "User"; message: string; createdAt: Date }[]): Promise<EvaluationResult> {
  const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY! });

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: RESULT_PROMPT.replace("{{USER_TRANSCRIPT}}", JSON.stringify(messages)),
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(outputSchema),
    },
  });

  logger.info("Gemini evaluation complete");
  return outputSchema.parse(JSON.parse(response.text!));
}

async function evaluateWithOpenAI(messages: { type: "Assistant" | "User"; message: string; createdAt: Date }[]): Promise<EvaluationResult> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: RESULT_PROMPT.replace("{{USER_TRANSCRIPT}}", JSON.stringify(messages)) },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error("OpenAI evaluation error", { status: response.status, body });
    throw new Error(`OpenAI evaluation failed: ${response.status}`);
  }

  const data = await response.json();
  logger.info("OpenAI evaluation complete");
  return outputSchema.parse(JSON.parse(data.choices[0].message.content));
}

async function calculateResult(messages: { type: "Assistant" | "User"; message: string; createdAt: Date }[]): Promise<EvaluationResult> {
  if (config.GEMINI_API_KEY) {
    return evaluateWithGemini(messages);
  }

  logger.info("Gemini key not found, falling back to OpenAI for evaluation");
  return evaluateWithOpenAI(messages);
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
