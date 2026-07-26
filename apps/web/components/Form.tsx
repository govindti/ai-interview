"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Card, CardContent } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { Separator } from "@repo/ui/separator";
import { toast } from "sonner";
import axios from "axios";
import { BACKEND_URL } from "@/lib/config";
import { useRouter } from "next/navigation";
import { ArrowRight, GitFork, Loader2, Mic, Sparkles, Shield, Zap } from "lucide-react";

export function Form() {
    const [github, setGithub] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function onSubmit() {
        if (!github.trim()) {
            toast("Please provide a valid GitHub URL");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${BACKEND_URL}/api/v1/pre-interview`, {
                github: github.trim(),
            });
            router.push(`/interview/${response.data.id}`);
        } catch {
            toast("Something went wrong starting your interview. Please try again.");
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center px-6 py-12">
            <div className="flex w-full max-w-2xl flex-col items-center gap-10">
                {/* Hero */}
                <div className="flex flex-col items-center text-center">
                    <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1.5 text-xs">
                        <Mic className="size-3.5 text-primary" />
                        Voice-based technical interview
                    </Badge>

                    <h1 className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
                        AI Interview Kickstart
                    </h1>
                    <p className="mt-4 max-w-md text-balance text-base text-muted-foreground">
                        Drop your GitHub profile and start a live, voice-driven interview tailored to
                        your work. Get instant feedback when you&apos;re done.
                    </p>
                </div>

                {/* Input Card */}
                <Card className="w-full border-border/50 bg-card/60 shadow-lg backdrop-blur">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 rounded-xl border border-border bg-background/50 p-2 shadow-sm focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30 transition-all">
                            <div className="flex items-center pl-2 text-muted-foreground">
                                <GitFork className="size-5" />
                            </div>
                            <Input
                                value={github}
                                placeholder="https://github.com/your-username"
                                onChange={(e) => setGithub(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !loading && onSubmit()}
                                disabled={loading}
                                className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-10"
                            />
                            <Button
                                disabled={loading}
                                onClick={onSubmit}
                                size="lg"
                                className="shrink-0 gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Starting
                                    </>
                                ) : (
                                    <>
                                        Start interview
                                        <ArrowRight className="size-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="mt-3 text-center text-xs text-muted-foreground">
                            We&apos;ll ask for microphone access once your interview begins.
                        </p>
                    </CardContent>
                </Card>

                {/* Features */}
                <div className="grid w-full max-w-lg grid-cols-3 gap-4">
                    <div className="flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-card/40 p-4 text-center backdrop-blur">
                        <div className="grid size-9 place-items-center rounded-full bg-primary/10">
                            <Zap className="size-4 text-primary" />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">Real-time voice</p>
                    </div>
                    <div className="flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-card/40 p-4 text-center backdrop-blur">
                        <div className="grid size-9 place-items-center rounded-full bg-primary/10">
                            <Sparkles className="size-4 text-primary" />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">AI feedback</p>
                    </div>
                    <div className="flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-card/40 p-4 text-center backdrop-blur">
                        <div className="grid size-9 place-items-center rounded-full bg-primary/10">
                            <Shield className="size-4 text-primary" />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">GitHub-based</p>
                    </div>
                </div>

                <Separator className="max-w-xs" />

                <p className="text-center text-xs text-muted-foreground/60">
                    Powered by OpenAI Realtime API &amp; Gemini evaluation
                </p>
            </div>
        </main>
    );
}
