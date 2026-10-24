"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RecordingStatus = "idle" | "requesting" | "recording" | "stopping" | "ready";
const LIMIT_SECONDS = 30;

export function useRecording() {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  const generation = useRef(0);
  const permissionPending = useRef(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const objectUrl = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const deadline = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  const releaseMicrophone = useCallback(() => {
    if (timer.current !== null) clearInterval(timer.current);
    if (deadline.current !== null) clearTimeout(deadline.current);
    timer.current = null;
    deadline.current = null;
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
  }, []);

  const discard = useCallback(() => {
    generation.current++;
    permissionPending.current = false;
    audio.current?.pause();
    const current = recorder.current;
    recorder.current = null;
    if (current) {
      current.ondataavailable = null;
      current.onstop = null;
      current.onerror = null;
      if (current.state !== "inactive") current.stop();
    }
    releaseMicrophone();
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
    if (mounted.current) {
      setUrl(null);
      setElapsed(0);
      setError("");
      setStatus("idle");
    }
  }, [releaseMicrophone]);

  const stop = useCallback(() => {
    if (recorder.current?.state === "recording") {
      setStatus("stopping");
      recorder.current.stop();
      releaseMicrophone();
    }
  }, [releaseMicrophone]);

  const pausePlayback = useCallback(() => { audio.current?.pause(); }, []);
  const attachAudio = useCallback((element: HTMLAudioElement | null) => {
    if (audio.current !== element) audio.current?.pause();
    audio.current = element;
  }, []);

  const start = useCallback(async () => {
    discard();
    if (!window.isSecureContext) {
      setError("Recording needs HTTPS, or localhost while practicing on this computer.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("This browser can’t record audio. You can still listen to and reveal the answer.");
      return;
    }
    const attempt = generation.current;
    permissionPending.current = true;
    setStatus("requesting");
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current || generation.current !== attempt) {
        media.getTracks().forEach(track => track.stop());
        return;
      }
      permissionPending.current = false;
      stream.current = media;
      const format = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"].find(type => typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(type));
      const current = format ? new MediaRecorder(media, { mimeType: format }) : new MediaRecorder(media);
      recorder.current = current;
      const chunks: Blob[] = [];
      current.ondataavailable = event => {
        if (generation.current === attempt && event.data.size) chunks.push(event.data);
      };
      current.onstop = () => {
        if (!mounted.current || generation.current !== attempt) return;
        releaseMicrophone();
        recorder.current = null;
        const clip = new Blob(chunks, { type: current.mimeType });
        if (!clip.size) {
          setError("No audio was captured. Please try recording again.");
          setStatus("idle");
          return;
        }
        const nextUrl = URL.createObjectURL(clip);
        objectUrl.current = nextUrl;
        setUrl(nextUrl);
        setStatus("ready");
      };
      current.onerror = () => {
        if (generation.current !== attempt) return;
        discard();
        setError("Recording was interrupted. Please try again.");
      };
      current.start();
      const startedAt = Date.now();
      setStatus("recording");
      timer.current = setInterval(() => setElapsed(Math.min(LIMIT_SECONDS, Math.floor((Date.now() - startedAt) / 1000))), 250);
      deadline.current = setTimeout(() => { setElapsed(LIMIT_SECONDS); stop(); }, LIMIT_SECONDS * 1000);
    } catch (cause) {
      if (!mounted.current || generation.current !== attempt) return;
      discard();
      const name = cause instanceof DOMException ? cause.name : "";
      setError(name === "NotAllowedError" || name === "SecurityError"
        ? "Microphone permission was denied. Allow microphone access in your browser settings, then try again."
        : name === "NotFoundError"
          ? "No microphone was found. Connect one and try again."
          : "We couldn’t start the microphone. Check that another app isn’t using it, then try again.");
    }
  }, [discard, releaseMicrophone, stop]);

  useEffect(() => {
    mounted.current = true;
    const onHidden = () => {
      if (document.visibilityState !== "hidden") return;
      audio.current?.pause();
      if (recorder.current?.state === "recording") stop();
      else if (permissionPending.current) discard();
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", discard);
    return () => {
      mounted.current = false;
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", discard);
      discard();
    };
  }, [discard, stop]);

  return { status, url, elapsed, error, audioRef: attachAudio, start, stop, discard, pausePlayback };
}
