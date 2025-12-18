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
 * 2. If timeout detected → unintentional_disconnect, loss preserved
 * 3. If network snapshot shows high packet loss → unintentional_disconnect, loss preserved
 * 4. If network snapshot shows high latency → unintentional_disconnect, loss preserved
 * 5. If network snapshot shows hard disconnect → unintentional_disconnect, loss preserved
 * 6. Otherwise → no disconnect, no loss
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
  } = signals

  // Initialize signal flags
  const signalFlags = {
    quitDetected: quitAction,
    timeoutDetected: false,
    highPacketLoss: false,
    highLatency: false,
    hardDisconnect: false,
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
  if (quitAction) {
    return {
      type: "intentional_disconnect",
      lossApplied: true,
      signals: signalFlags,
    }
  }

  // 2. Unintentional disconnect: network problems detected
  if (
    signalFlags.timeoutDetected ||
    signalFlags.highPacketLoss ||
    signalFlags.highLatency ||
    signalFlags.hardDisconnect
  ) {
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

