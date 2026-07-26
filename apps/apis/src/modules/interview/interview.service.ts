import { prisma } from "@repo/db";
import { scrapeGithub } from "../../scrapers/github";
import { NotFoundError } from "../../lib/errors";

export async function createInterview(githubUrl: string) {
  const cleanUrl = githubUrl.endsWith("/") ? githubUrl.slice(0, -1) : githubUrl;
  const githubUsername = cleanUrl.split("/").pop()!;

  const githubData = await scrapeGithub(githubUsername);

  const interview = await prisma.interview.create({
    data: {
      githubMetadata: JSON.stringify(githubData),
      status: "Pre",
    },
  });

  return { id: interview.id };
}

export async function getInterview(interviewId: string) {
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId },
    include: { conversations: true },
  });

  if (!interview) {
    throw new NotFoundError("Interview");
  }

  return interview;
}

export async function saveUserMessage(interviewId: string, message: string) {
  await prisma.message.create({
    data: {
      interviewId,
      type: "User",
      message,
    },
  });
}
