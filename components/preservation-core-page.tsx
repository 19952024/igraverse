"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  classifyDisconnect,
  type DisconnectType,
  type NetworkSnapshot,
  type ClassificationResult,
} from "@/lib/preservation-core"

interface PreservationCorePageProps {
  active: boolean
}

type MatchStatus = "idle" | "running" | "completed" | "disconnected"

interface MatchReport {
  matchId: string
  disconnectDetected: boolean
  disconnectClassification: DisconnectType
  lossApplied: boolean
  preservationCoreStatus: "active"
  status: MatchStatus
  playerScore: number
  aiScore: number
  networkBeforeDisconnect?: NetworkSnapshot
}

const MATCH_DURATION_SECONDS = 40 // within the requested 30–60s window

export default function PreservationCorePage({ active }: PreservationCorePageProps) {
  const [status, setStatus] = useState<MatchStatus>("idle")
  const [remaining, setRemaining] = useState<number>(MATCH_DURATION_SECONDS)
  const [playerScore, setPlayerScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)

  const [quitPressed, setQuitPressed] = useState(false)
  const [network, setNetwork] = useState<NetworkSnapshot>({
    latencyMs: 40,
    packetLossRate: 0.01,
    isConnected: true,
  })
  const [networkBeforeDisconnect, setNetworkBeforeDisconnect] = useState<NetworkSnapshot | undefined>(undefined)
  const [disconnectType, setDisconnectType] = useState<DisconnectType>("none")
  const [lossApplied, setLossApplied] = useState(false)
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null)
  const [lastPacketTime, setLastPacketTime] = useState<number | null>(null)

  const [matchId, setMatchId] = useState<string>(() => createMatchId())
  const [report, setReport] = useState<MatchReport | null>(null)

  const networkDropInjectedRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const matchStartTimeRef = useRef<number | null>(null)

  // derived helper
  const disconnectDetected = disconnectType !== "none"

  const currentReport: MatchReport | null = useMemo(() => {
    if (!report) return null
    return report
  }, [report])

  function createMatchId() {
    const now = new Date()
    const ts = now.toISOString()
    const rand = Math.random().toString(16).slice(2, 8)
    return `PCORE-${ts}-${rand}`
  }

  function resetMatch() {
    setStatus("idle")
    setRemaining(MATCH_DURATION_SECONDS)
    setPlayerScore(0)
    setAiScore(0)
    setQuitPressed(false)
    setDisconnectType("none")
    setLossApplied(false)
    setClassificationResult(null)
    setLastPacketTime(null)
    setNetwork({
      latencyMs: 40,
      packetLossRate: 0.01,
      isConnected: true,
    })
    setNetworkBeforeDisconnect(undefined)
    networkDropInjectedRef.current = false
    matchStartTimeRef.current = null
    setMatchId(createMatchId())
    setReport(null)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function performClassification(): ClassificationResult {
    const now = Date.now()
    const timeSinceLastPacket = lastPacketTime ? now - lastPacketTime : undefined

    const result = classifyDisconnect({
      quitAction: quitPressed,
      networkBeforeDisconnect,
      timeSinceLastPacket,
    })

    console.groupCollapsed("[PreservationCore] classifyDisconnect")
    console.log("quitAction:", quitPressed)
    console.log("networkBeforeDisconnect:", networkBeforeDisconnect)
    console.log("timeSinceLastPacket:", timeSinceLastPacket, "ms")
    console.log("Result:", result)
    console.groupEnd()

    return result
  }

  function finalizeMatch(finalStatus: MatchStatus) {
    const result = performClassification()
    setClassificationResult(result)
    setDisconnectType(result.type)
    setLossApplied(result.lossApplied)

    const snapshot: MatchReport = {
      matchId,
      disconnectDetected: result.type !== "none",
      disconnectClassification: result.type,
      lossApplied: result.lossApplied,
      preservationCoreStatus: "active",
      status: finalStatus,
      playerScore,
      aiScore,
      networkBeforeDisconnect,
    }
    setReport(snapshot)

    console.groupCollapsed("[PreservationCore] Match finalized")
    console.log("matchId:", snapshot.matchId)
    console.log("status:", snapshot.status)
    console.log("disconnectDetected:", snapshot.disconnectDetected)
    console.log("disconnectClassification:", snapshot.disconnectClassification)
    console.log("lossApplied:", snapshot.lossApplied)
    console.log("playerScore:", snapshot.playerScore, "aiScore:", snapshot.aiScore)
    console.log("networkBeforeDisconnect:", snapshot.networkBeforeDisconnect)
    console.log("signals:", result.signals)
    console.groupEnd()
  }

  function startMatch() {
    resetMatch()
    setStatus("running")
    matchStartTimeRef.current = Date.now()
    setLastPacketTime(Date.now())
  }

  function handleQuitIntentional() {
    if (status !== "running") return
    setQuitPressed(true)
    if (!networkBeforeDisconnect) {
      setNetworkBeforeDisconnect({ ...network })
    }
    setStatus("disconnected")
  }

  function handleSimulateNetworkDrop() {
    if (status !== "running") return
    // mark that we injected a network problem and update network snapshot
    networkDropInjectedRef.current = true
    const degraded: NetworkSnapshot = {
      latencyMs: 1200,
      packetLossRate: 0.4,
      isConnected: false,
      timestamp: Date.now(),
    }
    setNetwork(degraded)
    if (!networkBeforeDisconnect) {
      setNetworkBeforeDisconnect(degraded)
    }
    // Simulate timeout: stop updating last packet time (will be > 5s old)
    setStatus("disconnected")
  }

  // Main match loop: only ticks when active + running
  useEffect(() => {
    if (!active || status !== "running") {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1
        if (next <= 0) {
          // match completed normally
          setStatus("completed")
          return 0
        }
        return next
      })

      // simple random score progression to simulate a "game"
      setPlayerScore((prev) => prev + (Math.random() < 0.4 ? 1 : 0))
      setAiScore((prev) => prev + (Math.random() < 0.4 ? 1 : 0))

      // simulate normal network jitter when no injected drop
      setNetwork((prev) => {
        if (networkDropInjectedRef.current) return prev
        const jitter = (Math.random() - 0.5) * 10
        const lossJitter = (Math.random() - 0.5) * 0.01
        const nextLatency = Math.max(20, Math.min(120, prev.latencyMs + jitter))
        const nextLoss = Math.max(0, Math.min(0.05, prev.packetLossRate + lossJitter))
        // Simulate successful packet reception (update last packet time)
        if (Math.random() > nextLoss) {
          setLastPacketTime(Date.now())
        }
        return {
          latencyMs: nextLatency,
          packetLossRate: nextLoss,
          isConnected: true,
        }
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [active, status])

  // When match status moves to a terminal state, compute report
  useEffect(() => {
    if (status === "completed" || status === "disconnected") {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      finalizeMatch(status)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // small helper labels
  const statusLabel =
    status === "idle"
      ? "Idle – ready to start test match"
      : status === "running"
      ? "Match running"
      : status === "completed"
      ? "Match completed (normal)"
      : "Match ended due to disconnect"

  return (
    <main id="preservation-core" className={`view ${active ? "active" : ""}`}>
      <section className="container section">
        <div className="card">
          <div className="title" style={{ fontSize: "26px" }}>
            Igraverse – Preservation Core Platform
          </div>
          
          {/* IMMEDIATE ACTION: What To Do Next */}
          <div
            style={{
              marginTop: "20px",
              padding: "24px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)",
              border: "3px solid rgba(34, 197, 94, 0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <span style={{ fontSize: "32px" }}>👉</span>
              <div>
                <strong style={{ fontSize: "22px", color: "rgb(34, 197, 94)" }}>
                  Start Here: How Your Studio Gets Access
                </strong>
              </div>
            </div>
            <div style={{ fontSize: "16px", lineHeight: "1.8", marginBottom: "20px" }}>
              <p style={{ marginBottom: "20px", fontSize: "17px" }}>
                <strong>Ready to adopt Preservation Core?</strong> Here's exactly what to do:
              </p>
              
              {/* Quick Action Steps */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
                <div style={{ textAlign: "center", padding: "16px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "8px", border: "2px solid rgba(59, 130, 246, 0.4)" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>1️⃣</div>
                  <strong style={{ fontSize: "15px", display: "block", marginBottom: "6px" }}>Request Access</strong>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>Contact Igraverse</div>
                </div>
                <div style={{ textAlign: "center", padding: "16px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "8px", border: "2px solid rgba(34, 197, 94, 0.4)" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>2️⃣</div>
                  <strong style={{ fontSize: "15px", display: "block", marginBottom: "6px" }}>Get Credentials</strong>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>API Key + URL</div>
                </div>
                <div style={{ textAlign: "center", padding: "16px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "8px", border: "2px solid rgba(251, 191, 36, 0.4)" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>3️⃣</div>
                  <strong style={{ fontSize: "15px", display: "block", marginBottom: "6px" }}>Test Here</strong>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>Use sandbox below</div>
                </div>
                <div style={{ textAlign: "center", padding: "16px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "8px", border: "2px solid rgba(34, 197, 94, 0.4)" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>4️⃣</div>
                  <strong style={{ fontSize: "15px", display: "block", marginBottom: "6px" }}>Go Live</strong>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>Deploy to production</div>
                </div>
              </div>

              {/* Primary CTA */}
              <div
                style={{
                  padding: "18px",
                  borderRadius: "10px",
                  background: "rgba(34, 197, 94, 0.2)",
                  border: "2px solid rgba(34, 197, 94, 0.5)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>
                  🚀 Ready to Get Started?
                </div>
                <div style={{ fontSize: "15px", marginBottom: "16px" }}>
                  Contact your Igraverse representative or email us to request access and receive your API credentials.
                </div>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                  <div style={{ padding: "12px 24px", background: "rgb(34, 197, 94)", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", border: "2px solid rgba(255,255,255,0.2)" }}>
                    📧 Email: support@igraverse.com
                  </div>
                  <div style={{ padding: "12px 24px", background: "rgba(59, 130, 246, 0.3)", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", border: "2px solid rgba(59, 130, 246, 0.5)" }}>
                    💬 Contact Account Manager
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DETAILED ONBOARDING STEPS - Expanded Details */}
          <div
            style={{
              marginTop: "20px",
              padding: "20px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)",
              border: "2px solid rgba(59, 130, 246, 0.4)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <span style={{ fontSize: "24px" }}>📋</span>
              <div>
                <strong style={{ fontSize: "18px", color: "rgb(59, 130, 246)" }}>
                  Detailed Onboarding Steps
                </strong>
              </div>
            </div>
            <div style={{ fontSize: "15px", lineHeight: "1.8" }}>
              <p style={{ marginBottom: "16px" }}>
                <strong>Complete onboarding process:</strong> Here's what happens after you request access.
              </p>
              
              <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
                {/* Step 1: Request Access */}
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    background: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid rgba(148, 163, 184, 0.4)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "20px", fontWeight: "bold", color: "rgb(59, 130, 246)" }}>1</span>
                    <strong style={{ fontSize: "16px" }}>Request Access & Obtain Credentials</strong>
                  </div>
                  <div style={{ fontSize: "14px", paddingLeft: "30px", lineHeight: "1.6" }}>
                    <p style={{ marginBottom: "8px" }}>
                      Contact your Igraverse representative to request access to Preservation Core. You'll receive:
                    </p>
                    <ul style={{ paddingLeft: "20px", marginBottom: "8px" }}>
                      <li><strong>API Base URL:</strong> Your dedicated endpoint (e.g., <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px" }}>https://api.igraverse.com</code>)</li>
                      <li><strong>API Key:</strong> Authentication credential for your studio</li>
                      <li><strong>Sandbox Access:</strong> Test environment credentials</li>
                      <li><strong>Production Credentials:</strong> Provided after sandbox validation</li>
                    </ul>
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "10px",
                        borderRadius: "6px",
                        background: "rgba(59, 130, 246, 0.1)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        fontSize: "13px",
                      }}
                    >
                      <strong>What you'll receive:</strong> API Base URL, API Key (sandbox + production), integration documentation, and support contact.
                    </div>
                  </div>
                </div>

                {/* Step 2: Test in Sandbox */}
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    background: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid rgba(148, 163, 184, 0.4)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "20px", fontWeight: "bold", color: "rgb(34, 197, 94)" }}>2</span>
                    <strong style={{ fontSize: "16px" }}>Test in Sandbox Environment</strong>
                  </div>
                  <div style={{ fontSize: "14px", paddingLeft: "30px", lineHeight: "1.6" }}>
                    <p style={{ marginBottom: "8px" }}>
                      <strong>You're currently viewing the sandbox test harness.</strong> Use this interactive demo to:
                    </p>
                    <ul style={{ paddingLeft: "20px", marginBottom: "8px" }}>
                      <li>Validate disconnect classification logic with real scenarios</li>
                      <li>Test intentional quits, network drops, and normal match completion</li>
                      <li>Verify API responses match your game's requirements</li>
                      <li>Review signal breakdowns to understand decision logic</li>
                    </ul>
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "10px",
                        borderRadius: "6px",
                        background: "rgba(34, 197, 94, 0.1)",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                        fontSize: "13px",
                      }}
                    >
                      <strong>🔧 Sandbox API:</strong> Use your sandbox credentials to make test API calls to <code style={{ background: "rgba(0,0,0,0.2)", padding: "2px 6px", borderRadius: "4px" }}>POST https://sandbox.igraverse.com/api/preservation-core/classify</code> with your sandbox API key in the Authorization header.
                    </div>
                  </div>
                </div>

                {/* Step 3: Integrate into Your Game */}
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    background: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid rgba(148, 163, 184, 0.4)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "20px", fontWeight: "bold", color: "rgb(251, 191, 36)" }}>3</span>
                    <strong style={{ fontSize: "16px" }}>Integrate into Your Game (30-60 minutes)</strong>
                  </div>
                  <div style={{ fontSize: "14px", paddingLeft: "30px", lineHeight: "1.6" }}>
                    <p style={{ marginBottom: "8px" }}>
                      Add the API call to your existing disconnect handler:
                    </p>
                    <ol style={{ paddingLeft: "20px", marginBottom: "8px" }}>
                      <li>Capture network state (latency, packet loss, connection status)</li>
                      <li>Detect explicit quit actions (Alt+F4, quit button, etc.)</li>
                      <li>Make API call with your sandbox credentials</li>
                      <li>Apply the <code style={{ background: "rgba(0,0,0,0.2)", padding: "2px 6px", borderRadius: "4px" }}>lossApplied</code> decision from the response</li>
                    </ol>
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "10px",
                        borderRadius: "6px",
                        background: "rgba(251, 191, 36, 0.1)",
                        border: "1px solid rgba(251, 191, 36, 0.3)",
                        fontSize: "13px",
                      }}
                    >
                      <strong>📚 Integration Guide:</strong> See the <a href="/docs/preservation-core-day1-integration.md" target="_blank" style={{ color: "rgb(251, 191, 36)", textDecoration: "underline" }}>Day-1 Integration Guide</a> for copy-paste ready code examples.
                    </div>
                  </div>
                </div>

                {/* Step 4: Move to Production */}
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    background: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid rgba(148, 163, 184, 0.4)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "20px", fontWeight: "bold", color: "rgb(34, 197, 94)" }}>4</span>
                    <strong style={{ fontSize: "16px" }}>Deploy to Production</strong>
                  </div>
                  <div style={{ fontSize: "14px", paddingLeft: "30px", lineHeight: "1.6" }}>
                    <p style={{ marginBottom: "8px" }}>
                      Once sandbox testing is complete:
                    </p>
                    <ul style={{ paddingLeft: "20px", marginBottom: "8px" }}>
                      <li>Request production credentials from your Igraverse representative</li>
                      <li>Update your API endpoint to the production URL</li>
                      <li>Replace sandbox API key with production key</li>
                      <li>Deploy to your game servers</li>
                    </ul>
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "10px",
                        borderRadius: "6px",
                        background: "rgba(34, 197, 94, 0.1)",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                        fontSize: "13px",
                      }}
                    >
                      <strong>✅ Production Ready:</strong> The API logic you tested in sandbox is identical to production. No code changes needed - just update credentials and endpoint URL.
                    </div>
                  </div>
                </div>
              </div>

              {/* Environment Comparison */}
              <div
                style={{
                  marginTop: "16px",
                  padding: "14px",
                  borderRadius: "8px",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px dashed rgba(148, 163, 184, 0.5)",
                }}
              >
                <strong style={{ fontSize: "15px", marginBottom: "10px", display: "block" }}>Sandbox vs Production:</strong>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                  <div>
                    <strong style={{ color: "rgb(34, 197, 94)" }}>Sandbox Environment</strong>
                    <ul style={{ paddingLeft: "20px", marginTop: "6px" }}>
                      <li>For testing and validation</li>
                      <li>Same API logic as production</li>
                      <li>No rate limits for testing</li>
                      <li>Test credentials provided</li>
                    </ul>
                  </div>
                  <div>
                    <strong style={{ color: "rgb(59, 130, 246)" }}>Production Environment</strong>
                    <ul style={{ paddingLeft: "20px", marginTop: "6px" }}>
                      <li>For live game servers</li>
                      <li>Identical API logic</li>
                      <li>Production-grade SLA</li>
                      <li>Production credentials required</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* PROMINENT: No Download - Cloud API */}
          <div
            style={{
              marginTop: "16px",
              padding: "16px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)",
              border: "2px solid rgba(59, 130, 246, 0.4)",
              fontSize: "15px",
              fontWeight: 500,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <span style={{ fontSize: "24px" }}>☁️</span>
              <div>
                <strong style={{ fontSize: "16px", color: "rgb(59, 130, 246)" }}>
                  No Download Required – Cloud-Based API Service
                </strong>
              </div>
            </div>
            <div style={{ fontSize: "14px", lineHeight: "1.6", marginTop: "8px" }}>
              <strong>Preservation Core is a cloud-based API.</strong> Game studios like EA Sports don't download or install anything. 
              Instead, your game servers make simple HTTP POST requests to our API endpoint when a player disconnects. 
              <strong style={{ color: "rgb(34, 197, 94)" }}> No SDK, no libraries, no installation – just API calls.</strong>
            </div>
          </div>

          {/* How Game Studios Integrate Section */}
          <div
            style={{
              marginTop: "16px",
              padding: "16px",
              borderRadius: "10px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(148, 163, 184, 0.3)",
            }}
          >
            <div className="title" style={{ fontSize: "18px", marginBottom: "12px" }}>
              How Game Studios Integrate (Example: EA Sports)
            </div>
            <div style={{ fontSize: "14px", lineHeight: "1.7" }}>
              <p style={{ marginBottom: "12px" }}>
                <strong>Real-world integration flow:</strong>
              </p>
              <ol style={{ paddingLeft: "20px", marginBottom: "12px" }}>
                <li style={{ marginBottom: "8px" }}>
                  <strong>Player disconnects</strong> during an online match (e.g., FIFA, Madden)
                </li>
                <li style={{ marginBottom: "8px" }}>
                  <strong>EA's game server detects the disconnect</strong> (using their existing networking code)
                </li>
                <li style={{ marginBottom: "8px" }}>
                  <strong>EA's server captures network data:</strong> latency, packet loss, connection status, quit action
                </li>
                <li style={{ marginBottom: "8px" }}>
                  <strong>EA's server makes API call:</strong> <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px" }}>POST https://api.igraverse.com/api/preservation-core/classify</code>
                </li>
                <li style={{ marginBottom: "8px" }}>
                  <strong>Preservation Core responds:</strong> <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px" }}>{"{ \"lossApplied\": false }"}</code>
                </li>
                <li>
                  <strong>EA's server applies the decision:</strong> If <code>lossApplied: false</code>, the match is preserved (no loss recorded). If <code>lossApplied: true</code>, a loss is applied.
                </li>
              </ol>
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  borderRadius: "8px",
                  background: "rgba(34, 197, 94, 0.1)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  fontSize: "13px",
                }}
              >
                <strong>Integration time:</strong> ~30-60 minutes. Add the API call to your existing disconnect handler. 
                Works with Unity, Unreal, custom engines, or any platform that can make HTTP requests.
              </div>
            </div>
          </div>

          <p className="lead" style={{ marginTop: "16px" }}>
            <strong>Goal:</strong> Eliminate unfair online losses when players disconnect due to internet issues instead of quitting.
            <br />
            <strong>How:</strong> Add a small API call in your disconnect handler that sends basic connection data and applies the yes/no decision it returns.
          </p>
          <p className="lead" style={{ marginTop: "8px", fontSize: "14px" }}>
            <strong>Sandbox Test Harness:</strong> This interactive demo is part of your sandbox environment. Use it to validate disconnect detection, classification, and loss application logic before integrating Preservation Core into your live game servers.
          </p>
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              borderRadius: "8px",
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              fontSize: "13px",
            }}
          >
            <strong>API Endpoint:</strong> Call{" "}
            <code style={{ background: "rgba(0,0,0,0.2)", padding: "2px 6px", borderRadius: "4px" }}>
              POST /api/preservation-core/classify
            </code>{" "}
            from your disconnect event handler. Pass: quit action + network state (latency, packet loss, connection status).{" "}
            <strong>Day-1 integration: ~30-60 minutes.</strong> See{" "}
            <a
              href="/docs/preservation-core-faq.md"
              target="_blank"
              style={{ color: "rgb(59, 130, 246)", textDecoration: "underline" }}
            >
              FAQ
            </a>{" "}
            for quick answers.
          </div>
          <div
            style={{
              marginTop: "8px",
              padding: "10px",
              borderRadius: "6px",
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              fontSize: "12px",
            }}
          >
            <strong>Note:</strong> This demo uses the <strong>exact same logic</strong> as the real API endpoint. The
            `classifyDisconnect()` function used here is identical to what the API calls. Results in this demo match what
            you'll get from <code>POST /api/preservation-core/classify</code>.
          </div>

          <div className="grid-2" style={{ gap: "16px", alignItems: "flex-start", marginTop: "12px" }}>
            {/* Left: mini game state */}
            <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="title" style={{ marginBottom: "4px", fontSize: "18px" }}>
                Sandbox Test Match (Player vs AI)
              </div>
              <div className="muted" style={{ fontSize: "13px" }}>
                <strong>Sandbox Testing:</strong> This interactive test harness uses the exact same API logic as production. 
                Test different disconnect scenarios to validate how Preservation Core will classify disconnects in your game. 
                The decision is enforced <strong>post-match</strong> when the match status changes to "completed" or "disconnected".
              </div>
              <div className="muted" style={{ fontSize: "12px", marginTop: "4px", fontStyle: "italic" }}>
                <strong>Important:</strong> Preservation Core only decides loss vs. no loss. Your game always owns match
                state, scores, and reconnection logic. When `lossApplied: false`, you decide how to handle it (no
                contest, allow reconnection, etc.).
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
                  marginTop: "4px",
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", opacity: 0.8 }}>Match timer</div>
                  <div style={{ fontSize: "22px", fontWeight: 700 }}>
                    {String(Math.max(0, remaining)).padStart(2, "0")}s
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", opacity: 0.8 }}>Status</div>
                  <div style={{ fontSize: "14px" }}>{statusLabel}</div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "8px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "rgba(15,23,42,0.6)",
                  border: "1px solid rgba(148,163,184,0.4)",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", opacity: 0.8 }}>Player</div>
                  <div style={{ fontSize: "20px", fontWeight: 700 }}>{playerScore}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", opacity: 0.8 }}>AI</div>
                  <div style={{ fontSize: "20px", fontWeight: 700 }}>{aiScore}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                <button className="btn" onClick={startMatch} disabled={status === "running"}>
                  Start Test Match
                </button>
                <button
                  className="btn"
                  onClick={handleQuitIntentional}
                  disabled={status !== "running"}
                  title="Simulate explicit user quit (Alt+F4 / quit button)"
                >
                  Quit Match (Intentional Disconnect)
                </button>
                <button
                  className="btn"
                  onClick={handleSimulateNetworkDrop}
                  disabled={status !== "running"}
                  title="Simulate network drop (packet loss / timeout)"
                >
                  Simulate Network Drop (Unintentional)
                </button>
              </div>

              <div style={{ marginTop: "8px" }}>
                <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "4px" }}>Live network state</div>
                <div style={{ fontSize: "13px" }}>
                  Latency: <strong>{Math.round(network.latencyMs)} ms</strong> · Packet loss:{" "}
                  <strong>{(network.packetLossRate * 100).toFixed(1)}%</strong> · Connected:{" "}
                  <strong>{network.isConnected ? "yes" : "no"}</strong>
                </div>
                <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "4px" }}>
                  For Test C, Preservation Core will inspect latency, packet loss and connection flag before the drop.
                </div>
              </div>
            </div>

            {/* Right: report */}
            <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="title" style={{ marginBottom: "4px", fontSize: "18px" }}>
                Match Result / Preservation Report
              </div>
              <div className="muted" style={{ fontSize: "13px" }}>
                After each run, validate Test A (normal finish), Test B (intentional quit) and Test C (network drop)
                against the values below.
              </div>

              {currentReport ? (
                <>
                  <div
                    style={{
                      marginTop: "6px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: "rgba(15,23,42,0.7)",
                      border: "1px solid rgba(148,163,184,0.5)",
                      fontSize: "13px",
                      display: "grid",
                      gap: "6px",
                    }}
                  >
                    <div>
                      <strong>Match ID</strong>: {currentReport.matchId}
                    </div>
                    <div>
                      <strong>Match status</strong>: {currentReport.status}
                    </div>
                    <div>
                      <strong>Score</strong>: Player {currentReport.playerScore} – AI {currentReport.aiScore}
                    </div>
                    <div>
                      <strong>Disconnect detected</strong>: {currentReport.disconnectDetected ? "yes" : "no"}
                    </div>
                    <div>
                      <strong>Disconnect classification</strong>: {currentReport.disconnectClassification}
                    </div>
                    <div>
                      <strong>Loss applied</strong>: {currentReport.lossApplied ? "yes" : "no"}
                    </div>
                    <div>
                      <strong>Preservation Core status</strong>: {currentReport.preservationCoreStatus}
                    </div>
                    {currentReport.networkBeforeDisconnect && (
                      <div style={{ marginTop: "4px" }}>
                        <strong>Network state before disconnect</strong>: latency{" "}
                        {Math.round(currentReport.networkBeforeDisconnect.latencyMs)} ms · packet loss{" "}
                        {(currentReport.networkBeforeDisconnect.packetLossRate * 100).toFixed(1)}% · connected{" "}
                        {currentReport.networkBeforeDisconnect.isConnected ? "yes" : "no"}
                      </div>
                    )}
                  </div>

                  {/* Visual debug: show the actual inputs and rule flags used for classification */}
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: "rgba(15,23,42,0.55)",
                      border: "1px dashed rgba(148,163,184,0.7)",
                      fontSize: "12px",
                      display: "grid",
                      gap: "4px",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "12px" }}>Preservation Core – Decision Inputs</div>
                    <div>
                      <strong>Quit signal</strong>: {quitPressed ? "true (intentional)" : "false"}
                    </div>
                    {lastPacketTime && (
                      <div>
                        <strong>Time since last packet</strong>:{" "}
                        {Math.round((Date.now() - lastPacketTime) / 1000)}s
                        {Date.now() - lastPacketTime >= 5000 && " (timeout detected)"}
                      </div>
                    )}
                    <div>
                      <strong>Snapshot available</strong>: {networkBeforeDisconnect ? "yes" : "no"}
                    </div>
                    {networkBeforeDisconnect && (
                      <>
                        <div>
                          <strong>Snapshot latency</strong>: {Math.round(networkBeforeDisconnect.latencyMs)} ms
                        </div>
                        <div>
                          <strong>Snapshot packet loss</strong>:{" "}
                          {(networkBeforeDisconnect.packetLossRate * 100).toFixed(1)}%
                        </div>
                        <div>
                          <strong>Snapshot connected</strong>: {networkBeforeDisconnect.isConnected ? "yes" : "no"}
                        </div>
                      </>
                    )}
                    {classificationResult && (
                      <div style={{ marginTop: "4px" }}>
                        <strong>Evaluated signals</strong>:
                        <ul style={{ marginTop: "4px", paddingLeft: "18px", fontSize: "11px" }}>
                          <li>
                            <strong>Quit detected</strong>: {classificationResult.signals.quitDetected ? "✓" : "✗"}
                          </li>
                          <li>
                            <strong>Timeout detected</strong>: {classificationResult.signals.timeoutDetected ? "✓" : "✗"}
                          </li>
                          <li>
                            <strong>High packet loss (≥ 25%)</strong>:{" "}
                            {classificationResult.signals.highPacketLoss ? "✓" : "✗"}
                          </li>
                          <li>
                            <strong>High latency (≥ 800 ms)</strong>:{" "}
                            {classificationResult.signals.highLatency ? "✓" : "✗"}
                          </li>
                          <li>
                            <strong>Hard disconnect</strong>: {classificationResult.signals.hardDisconnect ? "✓" : "✗"}
                          </li>
                        </ul>
                      </div>
                    )}
                    <div style={{ marginTop: "4px" }}>
                      <strong>Final decision</strong>: {currentReport.disconnectClassification} · loss applied:{" "}
                      {currentReport.lossApplied ? "yes" : "no"}
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "rgba(15,23,42,0.7)",
                    border: "1px dashed rgba(148,163,184,0.5)",
                    fontSize: "13px",
                  }}
                >
                  No report yet. Start a test match to generate a Preservation Core decision.
                </div>
              )}

              <div style={{ marginTop: "8px", fontSize: "12px", opacity: 0.75 }}>
                <strong>Expected behaviour</strong>:
                <ul style={{ marginTop: "4px", paddingLeft: "18px" }}>
                  <li>
                    <strong>Test A – normal match</strong>: let timer expire with no quit or drop → disconnect detected:
                    no, classification: none, loss applied: normal win/loss only.
                  </li>
                  <li>
                    <strong>Test B – intentional disconnect</strong>: press Quit while running → disconnect detected:
                    yes, classification: intentional_disconnect, loss applied: yes.
                  </li>
                  <li>
                    <strong>Test C – unintentional disconnect</strong>: click Simulate Network Drop → disconnect detected:
                    yes, classification: unintentional_disconnect, loss applied: no.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}


