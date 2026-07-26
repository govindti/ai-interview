"use client";

import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Bot, Loader2, Sparkles, User } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { Card, CardContent, CardHeader } from "@repo/ui/card";
import { Separator } from "@repo/ui/separator";
import { ScrollArea } from "@repo/ui/scroll-area";
import { Progress } from "@repo/ui/progress";
import { cn } from "@repo/ui/utils";

interface ResultData {
    transcript: { type: "Assistant" | "User"; content: string; createdAt: string }[];
    score: number;
    feedback: string;
    status: "Done" | "InProgress" | "Pre";
}

export function Result() {
    const { interviewId } = useParams();
    const router = useRouter();
    const [result, setResult] = useState<ResultData>({
        score: 0,
        feedback: "",
        transcript: [],
        status: "Pre",
    });

    useEffect(() => {
        const fetchResult = () =>
            axios.get(`${BACKEND_URL}/api/v1/result/${interviewId}`).then((response) => {
                setResult(response.data);
                return response.data.status as ResultData["status"];
            });

        fetchResult();
        const intervalId = setInterval(async () => {
            const s = await fetchResult();
            if (s === "Done") clearInterval(intervalId);
        }, 5000);

        return () => clearInterval(intervalId);
    }, [interviewId]);

    const ready = result.status === "Done";
    const scorePercent = (result.score / 10) * 100;

    return (
        <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
            {/* Header */}
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Interview results</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Your feedback and full conversation transcript.
                    </p>
                </div>
                <Button variant="outline" onClick={() => router.push("/")}>
                    New interview
                </Button>
            </header>

            {!ready ? (
                <Card className="border-border/50 bg-card/50">
                    <CardContent className="flex flex-col items-center justify-center gap-4 py-24">
                        <div className="grid size-14 place-items-center rounded-full bg-muted/50">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium">Analyzing your interview</p>
                            <p className="mt-1 text-sm text-muted-foreground/70">
                                This usually takes a few seconds.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col gap-6">
                    {/* Score + Feedback */}
                    <Card className="border-border/50 bg-card/60 backdrop-blur">
                        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="size-4 text-violet-400" />
                                <span className="text-sm font-medium text-muted-foreground">
                                    AI Feedback
                                </span>
                            </div>
                            <Badge
                                variant={scorePercent >= 70 ? "default" : scorePercent >= 40 ? "secondary" : "destructive"}
                                className="text-base tabular-nums"
                            >
                                {result.score} / 10
                            </Badge>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Progress
                                value={scorePercent}
                                className="h-2"
                                indicatorClassName={cn(
                                    scorePercent >= 70
                                        ? "bg-emerald-500"
                                        : scorePercent >= 40
                                            ? "bg-amber-500"
                                            : "bg-red-500"
                                )}
                            />
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                                {result.feedback}
                            </p>
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* Transcript */}
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-medium text-muted-foreground">
                                Conversation
                            </h2>
                            <Badge variant="outline" className="text-xs">
                                {result.transcript.length} messages
                            </Badge>
                        </div>

                        {result.transcript.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No messages were recorded for this interview.
                            </p>
                        ) : (
                            <ScrollArea className="max-h-[500px]">
                                <div className="flex flex-col gap-3 pr-4">
                                    {result.transcript.map((m, i) => {
                                        const isAi = m.type === "Assistant";
                                        return (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "flex gap-3",
                                                    isAi ? "justify-start" : "flex-row-reverse",
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "grid size-8 shrink-0 place-items-center rounded-full text-white",
                                                        isAi
                                                            ? "bg-gradient-to-br from-violet-400 to-indigo-600"
                                                            : "bg-gradient-to-br from-emerald-300 to-teal-600",
                                                    )}
                                                >
                                                    {isAi ? (
                                                        <Bot className="size-4" />
                                                    ) : (
                                                        <User className="size-4" />
                                                    )}
                                                </div>
                                                <div
                                                    className={cn(
                                                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                                                        isAi
                                                            ? "rounded-tl-sm bg-card text-foreground border border-border/50"
                                                            : "rounded-tr-sm bg-primary text-primary-foreground",
                                                    )}
                                                >
                                                    {m.content}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
