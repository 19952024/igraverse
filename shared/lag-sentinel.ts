/**
 * Lag Sentinel – Console MVP (Simplified)
 *
 * Detects abnormal network latency patterns and possible lag manipulation
 * based on basic ping telemetry from console matches (PlayStation / Xbox).
 *
 * Two core behaviours:
 * 1) Ping Spike Detection
 * 2) Mercy Disconnect (Match Protection)
 */

export interface PingSample {
  /** Absolute timestamp in milliseconds (e.g. Date.now()) */
  timestampMs: number;
  /** Measured round‑trip latency in milliseconds */
  pingMs: number;
}

export interface PingSpikeConfig {
  /** Threshold above which a ping value is treated as a spike. Requirement: ping > 200ms. */
  spikeThresholdMs: number;
  /**
   * Rolling time window (in ms) used to decide whether
   * "multiple spikes" occurred in a short period.
   *
   * For the MVP we treat 10 seconds as a "short time window".
   */
  spikeWindowMs: number;
  /**
   * Minimum number of spikes inside the time window required
   * to consider the connection unstable due to spikes.
   *
   * Requirement only says "multiple spikes", so we implement that
   * as 2 or more spikes in the window.
   */
  spikesForUnstable: number;
}

export interface MercyDisconnectConfig extends PingSpikeConfig {
  /**
   * Duration (in ms) for which ping must stay above the spike
   * threshold to be considered "sustained high ping".
   *
   * Requirement: Ping > 200ms sustained for more than 15 seconds.
   */
  sustainedHighPingMs: number;
}

export interface PingSpikeAnalysis {
  /** Total number of spikes over the whole match */
  totalSpikes: number;
  /** Number of spikes observed inside the most recent rolling window */
  recentWindowSpikes: number;
  /** True if connection is considered unstable due to multiple spikes in a short window */
  unstable: boolean;
}

export interface MercyDisconnectDecision {
  /** True if conditions to end the match early are met */
  shouldTerminateMatch: boolean;
  /**
   * True if ping has been above the threshold for longer than
   * the configured sustained duration (requirement: 15s).
   */
  sustainedHighPing: boolean;
  /**
   * True if the reason is "multiple severe ping spikes within a short time window".
   */
  multipleSpikesInWindow: boolean;
  /**
   * Optional explanation string that can be logged or surfaced in tooling,
   * e.g. "Match terminated due to unstable connection."
   */
  reason: string | null;
}

export const DEFAULT_PING_SPIKE_CONFIG: PingSpikeConfig = {
  spikeThresholdMs: 200,
  spikeWindowMs: 10_000, // 10 seconds is our explicit "short time window"
  spikesForUnstable: 2, // requirement: "multiple spikes" → 2 or more
};

export const DEFAULT_MERCY_DISCONNECT_CONFIG: MercyDisconnectConfig = {
  ...DEFAULT_PING_SPIKE_CONFIG,
  sustainedHighPingMs: 15_000, // requirement: > 15 seconds
};

/**
 * Ping Spike Detection
 *
 * Implements the requirement:
 * - Track ping values during the match.
 * - If ping > 200ms → log the spike.
 * - If multiple spikes occur within a short period, the connection is considered unstable.
 */
export function analyzePingSpikes(
  samples: PingSample[],
  nowMs: number,
  config: PingSpikeConfig = DEFAULT_PING_SPIKE_CONFIG
): PingSpikeAnalysis {
  if (!samples.length) {
    return {
      totalSpikes: 0,
      recentWindowSpikes: 0,
      unstable: false,
    };
  }

  const { spikeThresholdMs, spikeWindowMs, spikesForUnstable } = config;

  // Identify which samples are spikes
  const spikes = samples.filter((s) => s.pingMs > spikeThresholdMs);

  // Count spikes in the recent rolling window [nowMs - spikeWindowMs, nowMs]
  const windowStart = nowMs - spikeWindowMs;
  const recentWindowSpikes = spikes.filter((s) => s.timestampMs >= windowStart).length;

  const unstable = recentWindowSpikes >= spikesForUnstable;

  return {
    totalSpikes: spikes.length,
    recentWindowSpikes,
    unstable,
  };
}

/**
 * Mercy Disconnect (Match Protection)
 *
 * Implements the requirement:
 *
 * If any of the following occurs:
 *  - Ping > 200ms sustained for more than 15 seconds
 *  OR
 *  - Multiple severe ping spikes within a short time window
 * Then the system ends the match early.
 */
export function decideMercyDisconnect(
  samples: PingSample[],
  nowMs: number,
  config: MercyDisconnectConfig = DEFAULT_MERCY_DISCONNECT_CONFIG
): MercyDisconnectDecision {
  if (!samples.length) {
    return {
      shouldTerminateMatch: false,
      sustainedHighPing: false,
      multipleSpikesInWindow: false,
      reason: null,
    };
  }

  const {
    spikeThresholdMs,
    sustainedHighPingMs,
    spikeWindowMs,
    spikesForUnstable,
  } = config;

  // 1) Check sustained high ping condition.
  //
  // We scan from most recent sample backwards while ping stays > threshold,
  // and measure how long that "high ping streak" has lasted.
  let sustainedHighPing = false;
  {
    let highStart: number | null = null;

    // Walk backwards so we can stop as soon as ping drops below threshold.
    for (let i = samples.length - 1; i >= 0; i--) {
      const s = samples[i];
      if (s.pingMs > spikeThresholdMs) {
        highStart = s.timestampMs;
      } else {
        // Ping dropped below the threshold; stop the streak.
        break;
      }
    }

    if (highStart !== null) {
      const duration = nowMs - highStart;
      if (duration > sustainedHighPingMs) {
        sustainedHighPing = true;
      }
    }
  }

  // 2) Check "multiple severe ping spikes within a short time window".
  //
  // We reuse the spike analysis with the same configuration.
  const spikeAnalysis = analyzePingSpikes(samples, nowMs, {
    spikeThresholdMs,
    spikeWindowMs,
    spikesForUnstable,
  });
  const multipleSpikesInWindow = spikeAnalysis.unstable;

  const shouldTerminateMatch = sustainedHighPing || multipleSpikesInWindow;

  let reason: string | null = null;
  if (shouldTerminateMatch) {
    reason = "Match terminated due to unstable connection.";
  }

  return {
    shouldTerminateMatch,
    sustainedHighPing,
    multipleSpikesInWindow,
    reason,
  };
}

