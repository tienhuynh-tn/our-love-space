"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAnswerVoice() {
  const [available, setAvailable] = useState<"loading" | "ready" | "unavailable">("loading");
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const voice = useRef<SpeechSynthesisVoice | null>(null);
  const mounted = useRef(true);
  const generation = useRef(0);
  // Retain the utterance until completion (some mobile engines otherwise stop early).
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);

  const cancel = useCallback(() => {
    generation.current++;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    utterance.current = null;
    if (mounted.current) { setSpeaking(false); setError(""); }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const update = () => {
      if (!mounted.current) return;
      if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
        setAvailable("unavailable");
        return;
      }
      const voices = window.speechSynthesis.getVoices().filter(item => item.lang.toLowerCase().replace("_", "-") === "en-us");
      voice.current = voices.find(item => item.localService) ?? voices[0] ?? null;
      setAvailable(voice.current ? "ready" : "unavailable");
    };
    queueMicrotask(update);
    window.speechSynthesis?.addEventListener("voiceschanged", update);
    const onHidden = () => { if (document.visibilityState === "hidden") cancel(); };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", cancel);
    return () => {
      mounted.current = false;
      window.speechSynthesis?.removeEventListener("voiceschanged", update);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", cancel);
      cancel();
    };
  }, [cancel]);

  const speak = useCallback((text: string, slow = false) => {
    cancel();
    if (!voice.current) return;
    const attempt = generation.current;
    const next = new SpeechSynthesisUtterance(text);
    next.voice = voice.current;
    next.lang = "en-US";
    // Use a clearly distinct practice speed; the former 0.75 rate was subtle.
    next.rate = slow ? 0.5 : 1;
    next.onend = () => {
      if (mounted.current && generation.current === attempt) { setSpeaking(false); utterance.current = null; }
    };
    next.onerror = event => {
      if (!mounted.current || generation.current !== attempt) return;
      setSpeaking(false);
      utterance.current = null;
      if (event.error !== "canceled" && event.error !== "interrupted") setError("The voice couldn’t play. Please try again, or use the written guide.");
    };
    utterance.current = next;
    setSpeaking(true);
    try { window.speechSynthesis.speak(next); }
    catch { setSpeaking(false); setError("The voice couldn’t play. Please use the written guide."); }
  }, [cancel]);

  return { available, speaking, error, speak, cancel };
}
