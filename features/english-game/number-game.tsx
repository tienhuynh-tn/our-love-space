"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { buttonClass, Field, secondaryClass } from "@/components/ui/action-form";
import { LEVELS, MAX_NUMBER, parseRange, type NumberRange } from "@/lib/english-game/numbers";
import { MODES, nextPrompt, practiceContent, type PracticeMode, type PracticePrompt } from "@/lib/english-game/practice";
import { useRecording } from "./use-recording";
import { useAnswerVoice } from "./use-answer-voice";

function SoundIcon() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></svg>;
}
function MicrophoneIcon() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v4m-4 0h8" /></svg>;
}

export function NumberGame({ initialNumber }: { initialNumber: number }) {
  const [prompt, setPrompt] = useState<PracticePrompt>({ mode: "numbers", value: initialNumber });
  const mode = prompt.mode;
  const numericMode = mode === "numbers" || mode === "ordinals";
  const minimumAllowed = mode === "ordinals" ? 1 : 0;
  const [range, setRange] = useState<NumberRange>({ min: 0, max: 100 });
  const [level, setLevel] = useState("beginner");
  const [minimum, setMinimum] = useState("0");
  const [maximum, setMaximum] = useState("100");
  const [rangeError, setRangeError] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [slow, setSlow] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const { audioRef, ...recording } = useRecording();
  const voice = useAnswerVoice();
  const answer = practiceContent(prompt);
  const capturing = recording.status === "requesting" || recording.status === "recording" || recording.status === "stopping";
  const recordLabel = recording.status === "requesting" ? "Cancel microphone request" : recording.status === "recording" ? "Stop recording" : recording.status === "stopping" ? "Finishing recording" : recording.url ? "Record again" : "Record my voice";

  function nextRound(nextRange = range, nextMode: PracticeMode = mode) {
    voice.cancel();
    recording.discard();
    setPlaybackError("");
    setRevealed(false);
    setRange(nextRange);
    setPrompt(previous => nextPrompt(nextMode, nextRange, previous));
  }
  function listen() {
    if (voice.speaking) { voice.cancel(); return; }
    recording.pausePlayback();
    setPlaybackError("");
    voice.speak(answer.english, slow);
  }

  return <main className="min-h-dvh bg-[radial-gradient(ellipse_at_top_left,rgba(207,221,205,0.65),transparent_40rem)] px-4 py-5 text-stone-950 dark:bg-[radial-gradient(ellipse_at_top_left,rgba(70,96,79,0.22),transparent_40rem)] dark:text-stone-50 sm:px-6 sm:py-10">
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">English practice</h1>
        <Link href="/login" prefetch={false} className="inline-flex min-h-11 items-center rounded-xl px-1 text-xs font-medium text-stone-600 hover:underline dark:text-stone-300">Our private space ↗</Link>
      </header>

      <Card className="p-5 sm:p-7">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <Field label="Practice" name="practice"><select name="practice" className="travel-input" value={mode} onChange={event => {
            const nextMode = event.target.value as PracticeMode;
            const nextRange = { min: nextMode === "ordinals" ? 1 : 0, max: 100 };
            setLevel("beginner");
            setMinimum(String(nextRange.min));
            setMaximum("100");
            setRangeError("");
            nextRound(nextRange, nextMode);
          }}>{MODES.map(item => <option value={item.value} key={item.value}>{item.label}</option>)}</select></Field>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-stone-800 dark:accent-stone-200" checked={slow} onChange={event => { voice.cancel(); setSlow(event.target.checked); }} />Slow audio</label>
        </div>
        {numericMode && <div className="mt-3">
          <Field label="Range" name="level"><select name="level" className="travel-input" value={level} onChange={event => {
            const value = event.target.value;
            setLevel(value);
            setRangeError("");
            const preset = LEVELS.find(item => item.value === value);
            if (preset) nextRound({ min: Math.max(minimumAllowed, preset.min), max: preset.max });
            else { setMinimum(String(range.min)); setMaximum(String(range.max)); }
          }}>{LEVELS.map(item => <option value={item.value} key={item.value}>{Math.max(minimumAllowed, item.min).toLocaleString("en-US")}–{item.max.toLocaleString("en-US")}</option>)}<option value="custom">Custom · {range.min.toLocaleString("en-US")}–{range.max.toLocaleString("en-US")}</option></select></Field>
        </div>}
        {numericMode && level === "custom" && <form noValidate className="mt-4 space-y-3 border-t border-stone-500/15 pt-4" onSubmit={event => {
          event.preventDefault();
          try { const next = parseRange(minimum, maximum); if (next.min < minimumAllowed) throw new Error("Ordinal ranges start at 1."); setRangeError(""); nextRound(next); }
          catch (error) { setRangeError(error instanceof Error ? error.message : "Please check your range."); }
        }}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From" name="minimum" type="number" min={minimumAllowed} max={MAX_NUMBER} step={1} inputMode="numeric" value={minimum} onChange={event => setMinimum(event.target.value)} required />
            <Field label="To" name="maximum" type="number" min={minimumAllowed} max={MAX_NUMBER} step={1} inputMode="numeric" value={maximum} onChange={event => setMaximum(event.target.value)} required />
          </div>
          <button className={`${secondaryClass} w-full sm:w-auto`} type="submit">Use this range</button>
          {rangeError && <p role="alert" className="text-sm text-red-800 dark:text-red-200">{rangeError}</p>}
        </form>}

        <div aria-live="polite" aria-atomic="true" className="py-8 text-center sm:py-10">
          <h2 aria-label={`${mode === "numbers" ? "Number" : mode === "ordinals" ? "Ordinal" : mode === "dates" ? "Date" : "Time"} to pronounce: ${answer.display}`} className="font-semibold tabular-nums leading-tight tracking-tighter text-[clamp(2rem,9vw,4.5rem)] break-words">{answer.display}</h2>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button type="button" aria-label={recordLabel} className={`${secondaryClass} min-w-0 gap-2 max-[360px]:px-2 ${recording.status === "recording" ? "border-red-500/40 text-red-800 dark:text-red-200" : ""}`} disabled={recording.status === "stopping"} onClick={() => {
            if (recording.status === "requesting") { recording.discard(); return; }
            if (recording.status === "recording") { recording.stop(); return; }
            voice.cancel();
            setPlaybackError("");
            void recording.start();
          }}>{recording.status === "idle" && <MicrophoneIcon />}{recording.status === "requesting" ? "Cancel" : recording.status === "recording" ? "Stop" : recording.status === "stopping" ? "Finishing…" : recording.url ? "Record again" : "Record"}</button>
          <button type="button" className={`${secondaryClass} min-w-0 gap-2 max-[360px]:px-2`} disabled={capturing || voice.available !== "ready"} onClick={listen}>{!voice.speaking && <SoundIcon />}{voice.speaking ? "Stop audio" : "Listen"}</button>
          <button type="button" aria-expanded={revealed} aria-controls="number-answer" className={`${secondaryClass} min-w-0 max-[360px]:px-2`} onClick={() => setRevealed(value => !value)}>{revealed ? "Hide answer" : "Show answer"}</button>
          <button type="button" className={`${buttonClass} min-w-0 max-[360px]:px-2`} onClick={() => nextRound()}>Next</button>
        </div>

        <div className="mt-3 space-y-2 text-sm leading-6">
          {recording.status === "requesting" && <p role="status">Allow microphone access to start recording.</p>}
          {recording.status === "recording" && <div className="flex items-center justify-center gap-3"><span role="status" className="flex items-center gap-2"><span aria-hidden="true" className="size-2 rounded-full bg-red-600" />Recording</span><time className="tabular-nums" aria-label={`${recording.elapsed} seconds recorded`}>0:{String(recording.elapsed).padStart(2, "0")} / 0:30</time></div>}
          {recording.error && <p role="alert" className="text-red-800 dark:text-red-200">{recording.error}</p>}
          {recording.url && <audio ref={audioRef} src={recording.url} controls preload="metadata" aria-label="Your recording" className="w-full min-w-0" onPlay={() => { voice.cancel(); setPlaybackError(""); }} onError={() => setPlaybackError("This recording couldn’t play. Please try recording again.")} />}
          {playbackError && <p role="alert" className="text-red-800 dark:text-red-200">{playbackError}</p>}
          {voice.available === "loading" && <p role="status" className="text-xs text-stone-600 dark:text-stone-400">Loading voice…</p>}
          {voice.available === "unavailable" && <p role="status" className="text-xs text-stone-600 dark:text-stone-400">No American English voice is available. You can still record or show the answer.</p>}
          {voice.error && <p role="alert" className="text-red-800 dark:text-red-200">{voice.error}</p>}
        </div>

        <div id="number-answer" hidden={!revealed} role="region" aria-label="Practice answer" className="mt-5 border-t border-stone-500/20 pt-5">
          <dl className="space-y-3 break-words">
            <div><dt className="sr-only">In English</dt><dd className="text-xl font-semibold leading-8">{answer.english}</dd></div>
            <div><dt className="sr-only">IPA · American English</dt><dd className="text-base leading-7 text-stone-600 dark:text-stone-300">{answer.ipa}</dd></div>
            <div lang="vi"><dt className="text-xs text-stone-600 dark:text-stone-400">Gợi ý gần đúng</dt><dd className="mt-1 text-sm leading-6">{answer.vietnamese}</dd></div>
          </dl>
        </div>
      </Card>

      <p className="text-center text-xs leading-5 text-stone-600 dark:text-stone-400">Recordings stay in this tab and clear with the next prompt.</p>
      <details className="text-sm text-stone-600 dark:text-stone-300">
        <summary className="min-h-11 cursor-pointer py-3 text-xs">Help</summary>
        <div className="space-y-2 pb-4 text-xs leading-6">
          <p>Recordings are never uploaded and stop automatically after 30 seconds. Microphone access needs HTTPS or localhost.</p>
          <p>Listen uses an American English voice available in your browser. Slow audio changes the speed of the next answer.</p>
          <p>IPA is shown word by word. Vietnamese hints are approximate; capitals mark stress. Listen for sounds and final consonants that Vietnamese spelling can’t fully capture.</p>
          <p>Custom ranges accept whole numbers from 0 to 1,000,000. Ordinals start at 1. Use matching bounds to practice one value.</p>
          <p>Dates cover 2000–2099, with the month first. Times use a 12-hour clock with AM/PM; minutes below ten use “oh.” Switching practice modes resets the range and clears your recording.</p>
        </div>
      </details>
    </div>
  </main>;
}
