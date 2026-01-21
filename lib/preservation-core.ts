/**
 * Preservation Core - Disconnect Classification Engine
 * 
 * This module provides the core logic for classifying disconnects as intentional
 * or unintentional, and determining whether a loss should be applied.
 * 
 * Used by both the test harness UI and the developer-facing API.
 */

export type DisconnectType = "none" | "intentional_disconnect" | "unintentional_disconnect"

export interface NetworkSnapshot {
  latencyMs: number
  packetLossRate: number
  isConnected: boolean
  /** Optional: timestamp when the snapshot was taken (for timeout detection) */
  timestamp?: number
}

export interface DisconnectSignals {
  /** True if user explicitly quit (Alt+F4, quit button, etc.) */
  quitAction: boolean
  /** Network state before disconnect occurred */
  networkBeforeDisconnect?: NetworkSnapshot
  /** Optional: time since last successful packet/acknowledgment (ms) */
  timeSinceLastPacket?: number
  /** Optional: timeout threshold (ms). Default: 5000ms */
  timeoutThreshold?: number
  /** 
   * Optional: Competitive advantage signal (game-agnostic)
   * Range: -1.0 to 1.0
   * -1.0 = player is clearly losing/behind
   * 0.0 = match is even/neutral
   * 1.0 = player is clearly winning/ahead
   * 
   * Studio-defined: Your game server calculates this based on your game's metrics
   * (points, kills, rounds, health, map control, etc.). This is normalized and
   * game-agnostic - Preservation Core doesn't need to understand your game.
   * 
   * Examples:
   * - Basketball: (playerScore - opponentScore) / maxPossibleScoreDifference
   * - Call of Duty: (kills - deaths) / totalPossibleKills, or objective control percentage
   * - Fighting game: (playerHealth - opponentHealth) / maxHealth
   * - Strategy: (playerResources - opponentResources) / maxResources
   */
  competitiveAdvantage?: number
  /**
   * Optional: Fairness confidence signal (game-agnostic)
   * Range: 0.0 to 1.0
   * 0.0 = match outcome is highly uncertain, anything could happen
   * 0.5 = match is somewhat uncertain, outcome not yet clear
   * 1.0 = match outcome is likely settled, clear winner/loser
   * 
   * Studio-defined: Your game server calculates this based on match state.
   * Represents whether the match outcome is likely decided or still uncertain.
   * 
   * Examples:
   * - High confidence: Player is up 3-0 in a best-of-5, 30 seconds left in a 2-point game
   * - Low confidence: Match just started, scores are tied, lots of time remaining
   * - Medium confidence: Player is ahead but opponent has momentum, match could swing
   */
  fairnessConfidence?: number
}

export interface ClassificationResult {
  /** Type of disconnect detected */
  type: DisconnectType
  /** Whether a loss should be applied to the player */
  lossApplied: boolean
  /** Signals that triggered the classification */
  signals: {
    quitDetected: boolean
    timeoutDetected: boolean
    highPacketLoss: boolean
    highLatency: boolean
    hardDisconnect: boolean
    competitiveAdvantageUsed?: boolean
    fairnessConfidenceUsed?: boolean
  }
}

/**
 * Classification thresholds
 */
const THRESHOLDS = {
  /** Packet loss rate >= 25% indicates network problems */
  HIGH_PACKET_LOSS: 0.25,
  /** Latency >= 800ms indicates network problems */
  HIGH_LATENCY_MS: 800,
  /** Time since last packet >= 5s indicates timeout */
  TIMEOUT_MS: 5000,
} as const

/**
 * Classifies a disconnect based on available signals.
 * 
 * Decision logic:
 * 1. If quit action detected → intentional_disconnect, loss applied
 * 2. If network problems detected:
 *    a. If competitive advantage indicates player was winning → preserve (no loss)
 *    b. If competitive advantage indicates player was losing AND fairness confidence is high → may apply loss (prevent abuse)
 *    c. If fairness confidence is low (match uncertain) → preserve (no loss)
 *    d. Otherwise → preserve (no loss) - default to protecting player
 * 3. Otherwise → no disconnect, no loss
 * 
 * @param signals - Disconnect signals to evaluate
 * @returns Classification result with type, loss decision, and signal breakdown
 */
export function classifyDisconnect(signals: DisconnectSignals): ClassificationResult {
  const {
    quitAction,
    networkBeforeDisconnect,
    timeSinceLastPacket,
    timeoutThreshold = THRESHOLDS.TIMEOUT_MS,
    competitiveAdvantage,
    fairnessConfidence,
  } = signals

  // Initialize signal flags
  const signalFlags = {
    quitDetected: quitAction,
    timeoutDetected: false,
    highPacketLoss: false,
    highLatency: false,
    hardDisconnect: false,
    competitiveAdvantageUsed: competitiveAdvantage !== undefined,
    fairnessConfidenceUsed: fairnessConfidence !== undefined,
  }

  // Check for timeout
  if (timeSinceLastPacket !== undefined && timeSinceLastPacket >= timeoutThreshold) {
    signalFlags.timeoutDetected = true
  }

  // Evaluate network snapshot if available
  if (networkBeforeDisconnect) {
    signalFlags.highPacketLoss = networkBeforeDisconnect.packetLossRate >= THRESHOLDS.HIGH_PACKET_LOSS
    signalFlags.highLatency = networkBeforeDisconnect.latencyMs >= THRESHOLDS.HIGH_LATENCY_MS
    signalFlags.hardDisconnect = !networkBeforeDisconnect.isConnected
  }

  // Decision logic (priority order matters)
  
  // 1. Intentional disconnect: explicit quit action
  // Always apply loss for intentional quits, regardless of competitive state
  if (quitAction) {
    return {
      type: "intentional_disconnect",
      lossApplied: true,
      signals: signalFlags,
    }
  }

  // 2. Unintentional disconnect: network problems detected
  const hasNetworkProblem = 
    signalFlags.timeoutDetected ||
    signalFlags.highPacketLoss ||
    signalFlags.highLatency ||
    signalFlags.hardDisconnect

  if (hasNetworkProblem) {
    // Use contextual signals if provided to improve accuracy
    if (competitiveAdvantage !== undefined || fairnessConfidence !== undefined) {
      // If player was clearly winning (advantaged), preserve match - unfair to lose
      if (competitiveAdvantage !== undefined && competitiveAdvantage > 0.3) {
        return {
          type: "unintentional_disconnect",
          lossApplied: false,
          signals: signalFlags,
        }
      }

      // If player was clearly losing (disadvantaged) AND match outcome is settled (high confidence)
      // AND fairness confidence is high → might be strategic disconnect, but still preserve by default
      // (We err on the side of protecting players - network issues can happen to anyone)
      if (
        competitiveAdvantage !== undefined && 
        competitiveAdvantage < -0.3 && 
        fairnessConfidence !== undefined && 
        fairnessConfidence > 0.8
      ) {
        // Even in this case, if there's clear network problems, preserve the match
        // The network signals take precedence over competitive state
        return {
          type: "unintentional_disconnect",
          lossApplied: false,
          signals: signalFlags,
        }
      }

      // If match outcome is highly uncertain (low fairness confidence), always preserve
      // Don't penalize players when match could still go either way
      if (fairnessConfidence !== undefined && fairnessConfidence < 0.3) {
        return {
          type: "unintentional_disconnect",
          lossApplied: false,
          signals: signalFlags,
        }
      }
    }

    // Default: network problems detected → preserve match (no loss)
    return {
      type: "unintentional_disconnect",
      lossApplied: false,
      signals: signalFlags,
    }
  }

  // 3. No disconnect detected (normal completion or below thresholds)
  return {
    type: "none",
    lossApplied: false,
    signals: signalFlags,
  }
}

/**
 * Validates network snapshot data
 */
export function validateNetworkSnapshot(snapshot: NetworkSnapshot): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (snapshot.latencyMs < 0) {
    errors.push("latencyMs must be >= 0")
  }
  if (snapshot.packetLossRate < 0 || snapshot.packetLossRate > 1) {
    errors.push("packetLossRate must be between 0 and 1")
  }
  if (typeof snapshot.isConnected !== "boolean") {
    errors.push("isConnected must be a boolean")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validates competitive advantage signal
 * Must be between -1.0 and 1.0
 */
export function validateCompetitiveAdvantage(advantage: number): { valid: boolean; error?: string } {
  if (advantage < -1.0 || advantage > 1.0) {
    return {
      valid: false,
      error: "competitiveAdvantage must be between -1.0 and 1.0",
    }
  }
  return { valid: true }
}

/**
 * Validates fairness confidence signal
 * Must be between 0.0 and 1.0
 */
export function validateFairnessConfidence(confidence: number): { valid: boolean; error?: string } {
  if (confidence < 0.0 || confidence > 1.0) {
    return {
      valid: false,
      error: "fairnessConfidence must be between 0.0 and 1.0",
    }
  }
  return { valid: true }
}

