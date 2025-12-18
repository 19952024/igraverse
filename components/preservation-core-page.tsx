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
            Igraverse – Preservation Core Test Harness
          </div>
          <p className="lead">
            <strong>Goal:</strong> Eliminate unfair online losses when players disconnect due to internet issues instead of quitting.
            <br />
            <strong>How:</strong> Add a small API call in your disconnect handler that sends basic connection data and applies the yes/no decision it returns.
          </p>
          <p className="lead" style={{ marginTop: "8px", fontSize: "14px" }}>
            This test harness validates disconnect detection, classification, and loss application logic before integrating Preservation Core into live titles.
          </p>
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
            <strong>Developer Integration:</strong> Preservation Core is a cloud-based API (no download needed). Call{" "}
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
                1v1 Test Match (Player vs AI)
              </div>
              <div className="muted" style={{ fontSize: "13px" }}>
                This is a simplified harness. The only purpose is to decide if a disconnect counts as a loss or is
                preserved. The decision is enforced <strong>post-match</strong> when the match status changes to
                "completed" or "disconnected".
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


