import { useEffect, useRef, useState } from "react";

export const TOUR_CHARACTERS_PER_SECOND = 30;
export interface TypingSchedule { times: number[]; total: number }
export interface ScheduleInput {
  text: string;
  cps: number;
  endCps?: number;
  holdMs?: number;
  leadMs: number;
  count?: { durationMs?: number };
}

/** A seeded schedule makes replay pacing identical, including punctuation. */
export function buildTypingSchedule(inputs: ScheduleInput[], seed: string): TypingSchedule {
  let state = 2166136261;
  for (const character of seed) state = Math.imul(state ^ character.charCodeAt(0), 16777619);
  const random = () => {
    let value = state += 0x6d2b79f5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
  const times: number[] = [];
  let total = 0;
  for (const input of inputs) {
    total += Math.max(0, input.leadMs);
    if (input.count) {
      total += input.count.durationMs ?? 900;
      times.push(total);
      total += Math.max(0, input.holdMs ?? 0);
      continue;
    }
    const startCps = Math.max(1, input.cps);
    const endCps = Math.max(1, input.endCps ?? input.cps);
    for (let index = 0; index < input.text.length; index++) {
      const progress = index / Math.max(1, input.text.length - 1);
      const cps = startCps + (endCps - startCps) * progress;
      const base = 1000 / cps;
      total += base * (0.85 + random() * 0.3);
      times.push(total);
      if (input.text[index] === ",") total += 180;
      if (/[.?!]/.test(input.text[index])) total += 280;
    }
    total += Math.max(0, input.holdMs ?? 0);
  }
  return { times, total };
}

function completedTicks(times: number[], elapsed: number) {
  let low = 0;
  let high = times.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (times[middle] <= elapsed) low = middle + 1;
    else high = middle;
  }
  return low;
}

/** All hosts share a pausable millisecond clock, including count-up windows. */
export function useTourTypewriter(key: string, schedule: TypingSchedule, enabled: boolean) {
  const [progress, setProgress] = useState({ key, elapsed: 0 });
  const clock = useRef({ key, elapsed: 0 });
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (clock.current.key !== key) {
      clock.current = { key, elapsed: 0 };
      setProgress({ key, elapsed: 0 });
    }
    if (reducedMotion || !enabled) return;
    const alreadyElapsed = clock.current.elapsed;
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = Math.min(schedule.total, alreadyElapsed + now - startedAt);
      clock.current.elapsed = elapsed;
      setProgress({ key, elapsed });
      if (elapsed < schedule.total) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      clock.current.elapsed = Math.min(schedule.total, alreadyElapsed + performance.now() - startedAt);
    };
  }, [key, schedule, enabled, reducedMotion]);

  const elapsed = reducedMotion ? schedule.total : progress.key === key ? progress.elapsed : 0;
  const characters = completedTicks(schedule.times, elapsed);
  const idle = elapsed - (schedule.times[characters - 1] ?? 0) > 350;
  return { characters, elapsed, idle, complete: elapsed >= schedule.total, reducedMotion };
}
