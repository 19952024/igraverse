/**
 * Controller Integrity – Console MVP (Simplified)
 *
 * Detects macro behavior, turbo inputs, and scripted controller patterns
 * by analyzing button press timing (input rhythm) during a match.
 *
 * This module:
 * 1) Tracks intervals between button presses and measures how consistent they are.
 * 2) Flags suspicious patterns when identical timing intervals repeat too many times.
 * 3) Produces a simple "normal" vs "suspicious" integrity signal for the match.
 */

/**
 * Raw per-press data – timestamp only for the simplified MVP.
 * All presses in the sequence are assumed to be for the same button/action
 * that you want to monitor (e.g. "A", "X", "shoot", etc.).
 */
export interface InputPressSample {
  /** Absolute timestamp in milliseconds (e.g. Date.now()) */
  timestampMs: number;
}

/**
 * Configuration for input rhythm analysis.
 */
export interface InputRhythmConfig {
  /**
   * How many identical timing intervals must appear consecutively
   * before we consider the pattern suspicious.
   *
   * Requirement: "If identical timing intervals repeat more than 10 times
   * consecutively → suspicious input."
   *
   * "More than 10 times" means at least 11 identical intervals in a row.
   */
  identicalIntervalRunThreshold: number;
}

export const DEFAULT_INPUT_RHYTHM_CONFIG: InputRhythmConfig = {
  identicalIntervalRunThreshold: 11,
};

/**
 * Detailed analysis of input rhythm for a sequence of button presses.
 */
export interface InputRhythmAnalysis {
  /** Total number of button presses in the sequence */
  totalPresses: number;
  /** Total number of intervals (presses - 1) used in the analysis */
  totalIntervals: number;
  /** List of computed intervals between presses, in ms */
  intervalsMs: number[];
  /** Average interval in ms (null if fewer than 2 presses) */
  meanIntervalMs: number | null;
  /** Population variance of intervals in ms^2 (null if fewer than 2 intervals) */
  varianceIntervalMs: number | null;
  /**
   * Longest run of identical consecutive intervals (same ms value)
   * inside the intervals array.
   */
  maxIdenticalIntervalRun: number;
}

/**
 * Match-level integrity result for controller input.
 * This does NOT apply penalties or bans; it only reports a signal.
 */
export interface ControllerIntegrityResult {
  /** "suspicious" when patterns look non-human, "normal" otherwise */
  status: "normal" | "suspicious";
  /** Convenience boolean mirror of status === "suspicious" */
  suspicious: boolean;
  /** Underlying rhythm analysis used to make the decision */
  analysis: InputRhythmAnalysis;
}

/**
 * Computes intervals and basic statistics from a sequence of press timestamps.
 *
 * Steps:
 * 1) Sort presses by timestamp (ascending).
 * 2) Compute the difference between consecutive press timestamps (intervals).
 * 3) Compute mean, variance, and the longest run of identical intervals.
 */
export function analyzeInputRhythm(
  samples: InputPressSample[],
  config: InputRhythmConfig = DEFAULT_INPUT_RHYTHM_CONFIG
): InputRhythmAnalysis {
  if (samples.length === 0) {
    return {
      totalPresses: 0,
      totalIntervals: 0,
      intervalsMs: [],
      meanIntervalMs: null,
      varianceIntervalMs: null,
      maxIdenticalIntervalRun: 0,
    };
  }

  // Sort by timestamp to be robust to out-of-order data.
  const sorted = [...samples].sort((a, b) => a.timestampMs - b.timestampMs);

  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const dt = sorted[i].timestampMs - sorted[i - 1].timestampMs;
    if (dt > 0) {
      intervals.push(dt);
    }
    // Non-positive intervals are ignored as corrupt / duplicate data.
  }

  const totalIntervals = intervals.length;

  if (totalIntervals === 0) {
    return {
      totalPresses: sorted.length,
      totalIntervals: 0,
      intervalsMs: [],
      meanIntervalMs: null,
      varianceIntervalMs: null,
      maxIdenticalIntervalRun: 0,
    };
  }

  // Compute mean
  const sum = intervals.reduce((acc, v) => acc + v, 0);
  const mean = sum / totalIntervals;

  // Compute population variance
  const variance =
    totalIntervals > 1
      ? intervals.reduce((acc, v) => {
          const diff = v - mean;
          return acc + diff * diff;
        }, 0) / totalIntervals
      : 0;

  // Compute longest run of identical consecutive intervals
  let maxRun = 1;
  let currentRun = 1;

  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i] === intervals[i - 1]) {
      currentRun += 1;
      if (currentRun > maxRun) {
        maxRun = currentRun;
      }
    } else {
      currentRun = 1;
    }
  }

  // If there is only one interval, maxRun remains 1.

  return {
    totalPresses: sorted.length,
    totalIntervals,
    intervalsMs: intervals,
    meanIntervalMs: mean,
    varianceIntervalMs: totalIntervals > 1 ? variance : null,
    maxIdenticalIntervalRun: maxRun,
  };
}

/**
 * Evaluates controller integrity for a sequence of button presses.
 *
 * Detection rule (from spec):
 * - "If identical timing intervals repeat more than 10 times consecutively → suspicious input."
 *
 * Implementation:
 * - We treat "more than 10 times" as a consecutive run of at least 11 identical intervals.
 * - If maxIdenticalIntervalRun >= identicalIntervalRunThreshold → status = "suspicious".
 * - Otherwise → status = "normal".
 *
 * This function does NOT enforce bans or penalties; it only returns a signal
 * that can be consumed by higher-level match or account systems.
 */
export function evaluateControllerIntegrity(
  samples: InputPressSample[],
  config: InputRhythmConfig = DEFAULT_INPUT_RHYTHM_CONFIG
): ControllerIntegrityResult {
  const analysis = analyzeInputRhythm(samples, config);
  const { identicalIntervalRunThreshold } = config;

  const suspicious =
    analysis.maxIdenticalIntervalRun >= identicalIntervalRunThreshold;

  return {
    status: suspicious ? "suspicious" : "normal",
    suspicious,
    analysis,
  };
}

