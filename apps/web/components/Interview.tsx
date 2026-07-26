"use client";

import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Bot, Loader2, PhoneOff, User } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { VoiceOrb } from "@/components/VoiceOrb";

type Status = "connecting" | "live" | "ending";

/** Attaches an analyser to a stream and returns a getter for its current 0..1 volume level. */
function createLevelMeter(ctx: AudioContext, stream: MediaStream) {
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);

    return () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            const v = (data[i]! - 128) / 128;
            sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        return Math.min(1, rms * 3.2);
    };
}

export function Interview() {
    const { interviewId } = useParams();
    const router = useRouter();

    const [status, setStatus] = useState<Status>("connecting");
    const [aiLevel, setAiLevel] = useState(0);
    const [userLevel, setUserLevel] = useState(0);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const userStreamRef = useRef<MediaStream | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const pc = new RTCPeerConnection();
            pcRef.current = pc;

            const audioCtx = new AudioContext();
            audioCtxRef.current = audioCtx;
            let aiMeter: (() => number) | null = null;
            let userMeter: (() => number) | null = null;

            const audioEl = document.createElement("audio");
            audioEl.autoplay = true;
            pc.ontrack = (e) => {
                const stream = e.streams[0]!;
                audioEl.srcObject = stream;
                aiMeter = createLevelMeter(audioCtx, stream);
            };

            const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (cancelled) {
                ms.getTracks().forEach((t) => t.stop());
                return;
            }
            userStreamRef.current = ms;
            userMeter = createLevelMeter(audioCtx, ms);

            const socket = new WebSocket("wss://api.deepgram.com/v1/listen", [
                "token",
                "",
            ]);
            socketRef.current = socket;

            socket.onopen = () => {
                const mediaRecorder = new MediaRecorder(ms, { mimeType: "audio/webm" });
                recorderRef.current = mediaRecorder;
                mediaRecorder.start(250);
                mediaRecorder.addEventListener("dataavailable", (event) => {
                    if (socket.readyState === WebSocket.OPEN) socket.send(event.data);
                });
            };

            socket.onmessage = (message) => {
                const received = JSON.parse(message.data);
                const transcript = received.channel?.alternatives[0]?.transcript;
                if (transcript) {
                    axios.post(`${BACKEND_URL}/api/v1/session/user/response/${interviewId}`, {
                        message: transcript,
                    });
                }
            };

            pc.addTrack(ms.getTracks()[0]!);

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            const sdpResponse = await fetch(`${BACKEND_URL}/api/v1/session/${interviewId}`, {
                method: "POST",
                body: offer.sdp,
                headers: { "Content-Type": "application/sdp" },
            });
            const answer = { type: "answer" as const, sdp: await sdpResponse.text() };
            await pc.setRemoteDescription(answer);

            if (cancelled) return;
            setStatus("live");

            const tick = () => {
                if (aiMeter) setAiLevel(aiMeter());
                if (userMeter) setUserLevel(userMeter());
                rafRef.current = requestAnimationFrame(tick);
            };
            rafRef.current = requestAnimationFrame(tick);
        })();

        return () => {
            cancelled = true;
            cleanup();
        };
    }, [interviewId]);

    function cleanup() {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
        socketRef.current?.close();
        userStreamRef.current?.getTracks().forEach((t) => t.stop());
        pcRef.current?.getSenders().forEach((s) => s.track?.stop());
        pcRef.current?.close();
        audioCtxRef.current?.close().catch(() => {});
    }

    function endInterview() {
        setStatus("ending");
        cleanup();
        router.push(`/result/${interviewId}`);
    }

    const aiSpeaking = aiLevel > 0.06 && aiLevel >= userLevel;
    const userSpeaking = userLevel > 0.06 && userLevel > aiLevel;

    return (
        <main className="flex h-screen w-screen flex-col overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-border/50 px-6 py-4">
                <div className="flex items-center gap-3">
                    {status === "live" ? (
                        <Badge variant="default" className="gap-1.5">
                            <span className="relative flex size-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                            </span>
                            Live
                        </Badge>
                    ) : status === "connecting" ? (
                        <Badge variant="secondary" className="gap-1.5">
                            <Loader2 className="size-3 animate-spin" />
                            Connecting
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="gap-1.5">
                            <Loader2 className="size-3 animate-spin" />
                            Wrapping up
                        </Badge>
                    )}
                </div>
                <span className="text-sm font-medium text-muted-foreground">AI Interview</span>
            </header>

            {/* Stage */}
            <div className="flex flex-1 items-center justify-center px-6">
                {status === "connecting" ? (
                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                        <div className="grid size-16 place-items-center rounded-full bg-muted/50">
                            <Loader2 className="size-7 animate-spin" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium">Setting up your interview</p>
                            <p className="mt-1 text-sm text-muted-foreground/70">
                                Requesting microphone access&hellip;
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex w-full max-w-3xl items-center justify-center gap-12 sm:gap-24">
                        <VoiceOrb
                            level={aiLevel}
                            speaking={aiSpeaking}
                            label="Interviewer"
                            sublabel="Listening"
                            icon={Bot}
                            accent="violet"
                        />
                        <VoiceOrb
                            level={userLevel}
                            speaking={userSpeaking}
                            label="You"
                            sublabel="Mic on"
                            icon={User}
                            accent="emerald"
                        />
                    </div>
                )}
            </div>

            {/* Controls */}
            <footer className="flex justify-center border-t border-border/50 px-6 py-6">
                <Button
                    variant="destructive"
                    size="lg"
                    onClick={endInterview}
                    disabled={status === "ending"}
                    className="gap-2 rounded-full px-8 shadow-lg"
                >
                    {status === "ending" ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <PhoneOff className="size-4" />
                    )}
                    End interview
                </Button>
            </footer>
        </main>
    );
}
