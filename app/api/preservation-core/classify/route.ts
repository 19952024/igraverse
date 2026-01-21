import { NextRequest, NextResponse } from "next/server"
import {
  classifyDisconnect,
  validateNetworkSnapshot,
  validateCompetitiveAdvantage,
  validateFairnessConfidence,
  type DisconnectSignals,
  type ClassificationResult,
} from "@/lib/preservation-core"

export const runtime = "nodejs"

/**
 * POST /api/preservation-core/classify
 * 
 * Developer-facing API endpoint for classifying disconnects.
 * 
 * Request body:
 * {
 *   quitAction: boolean,                    // Required: true if user explicitly quit
 *   networkBeforeDisconnect?: {              // Optional: network state before disconnect
 *     latencyMs: number,
 *     packetLossRate: number,               // 0.0 to 1.0
 *     isConnected: boolean,
 *     timestamp?: number
 *   },
 *   timeSinceLastPacket?: number,           // Optional: milliseconds since last packet
 *   timeoutThreshold?: number,              // Optional: timeout threshold in ms (default: 5000)
 *   competitiveAdvantage?: number,          // Optional: -1.0 to 1.0 (game-agnostic advantage signal)
 *   fairnessConfidence?: number             // Optional: 0.0 to 1.0 (match outcome certainty)
 * }
 * 
 * Response:
 * {
 *   type: "none" | "intentional_disconnect" | "unintentional_disconnect",
 *   lossApplied: boolean,
 *   signals: {
 *     quitDetected: boolean,
 *     timeoutDetected: boolean,
 *     highPacketLoss: boolean,
 *     highLatency: boolean,
 *     hardDisconnect: boolean
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate required fields
    if (typeof body.quitAction !== "boolean") {
      return NextResponse.json(
        { error: "Missing or invalid 'quitAction' field (must be boolean)" },
        { status: 400 }
      )
    }

    // Validate network snapshot if provided
    if (body.networkBeforeDisconnect) {
      const validation = validateNetworkSnapshot(body.networkBeforeDisconnect)
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Invalid networkBeforeDisconnect", details: validation.errors },
          { status: 400 }
        )
      }
    }

    // Validate competitive advantage if provided
    if (body.competitiveAdvantage !== undefined) {
      const validation = validateCompetitiveAdvantage(body.competitiveAdvantage)
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }
    }

    // Validate fairness confidence if provided
    if (body.fairnessConfidence !== undefined) {
      const validation = validateFairnessConfidence(body.fairnessConfidence)
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }
    }

    // Build signals object
    const signals: DisconnectSignals = {
      quitAction: body.quitAction,
      networkBeforeDisconnect: body.networkBeforeDisconnect,
      timeSinceLastPacket: body.timeSinceLastPacket,
      timeoutThreshold: body.timeoutThreshold,
      competitiveAdvantage: body.competitiveAdvantage,
      fairnessConfidence: body.fairnessConfidence,
    }

    // Classify disconnect
    const result = classifyDisconnect(signals)

    return NextResponse.json(result)
  } catch (err: any) {
    console.error("[PreservationCore API] Error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/preservation-core/classify
 * 
 * Returns API documentation and example usage.
 */
export async function GET() {
  return NextResponse.json({
    name: "Preservation Core Classification API",
    version: "1.0.0",
    description: "Classifies disconnects as intentional or unintentional, and determines if a loss should be applied.",
    endpoint: "/api/preservation-core/classify",
    method: "POST",
    request: {
      quitAction: {
        type: "boolean",
        required: true,
        description: "True if user explicitly quit (Alt+F4, quit button, etc.)",
      },
      networkBeforeDisconnect: {
        type: "object",
        required: false,
        description: "Network state before disconnect occurred",
        properties: {
          latencyMs: { type: "number", description: "Latency in milliseconds" },
          packetLossRate: { type: "number", description: "Packet loss rate (0.0 to 1.0)" },
          isConnected: { type: "boolean", description: "Whether connection was active" },
          timestamp: { type: "number", description: "Optional: timestamp when snapshot was taken" },
        },
      },
      timeSinceLastPacket: {
        type: "number",
        required: false,
        description: "Milliseconds since last successful packet/acknowledgment",
      },
      timeoutThreshold: {
        type: "number",
        required: false,
        description: "Timeout threshold in milliseconds (default: 5000)",
      },
      competitiveAdvantage: {
        type: "number",
        required: false,
        description: "Game-agnostic competitive advantage signal (-1.0 to 1.0). -1.0 = losing, 0.0 = neutral, 1.0 = winning. Studio-defined based on game metrics (points, kills, rounds, health, etc.).",
      },
      fairnessConfidence: {
        type: "number",
        required: false,
        description: "Game-agnostic fairness confidence signal (0.0 to 1.0). 0.0 = match outcome highly uncertain, 1.0 = match outcome likely settled. Studio-defined based on match state.",
      },
    },
    response: {
      type: {
        enum: ["none", "intentional_disconnect", "unintentional_disconnect"],
        description: "Type of disconnect detected",
      },
      lossApplied: {
        type: "boolean",
        description: "Whether a loss should be applied to the player",
      },
      signals: {
        type: "object",
        description: "Signals that triggered the classification",
        properties: {
          quitDetected: { type: "boolean" },
          timeoutDetected: { type: "boolean" },
          highPacketLoss: { type: "boolean" },
          highLatency: { type: "boolean" },
          hardDisconnect: { type: "boolean" },
          competitiveAdvantageUsed: { type: "boolean" },
          fairnessConfidenceUsed: { type: "boolean" },
        },
      },
    },
    example: {
      request: {
        quitAction: false,
        networkBeforeDisconnect: {
          latencyMs: 1200,
          packetLossRate: 0.4,
          isConnected: false,
        },
        timeSinceLastPacket: 6000,
        competitiveAdvantage: 0.7, // Player was winning
        fairnessConfidence: 0.6, // Match somewhat uncertain
      },
      response: {
        type: "unintentional_disconnect",
        lossApplied: false,
        signals: {
          quitDetected: false,
          timeoutDetected: true,
          highPacketLoss: true,
          highLatency: true,
          hardDisconnect: true,
        },
      },
    },
    thresholds: {
      HIGH_PACKET_LOSS: 0.25,
      HIGH_LATENCY_MS: 800,
      TIMEOUT_MS: 5000,
    },
  })
}

