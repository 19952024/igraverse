"use client"

import { useEffect, useRef } from "react"

interface TruePlayPageProps {
  active: boolean
}

export default function TruePlayPage({ active }: TruePlayPageProps) {
  const scanRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return

    const box = scanRef.current
    if (!box) return

    // Clear previous nodes/wires
    box.innerHTML = ""

    const makeNode = (x: number, y: number) => {
      const n = document.createElement("div")
      n.className = "node"
      n.style.left = x + "%"
      n.style.top = y + "%"
      box.appendChild(n)
      return n
    }

    const makeWire = (x1: number, y1: number, x2: number, y2: number) => {
      const w = document.createElement("div")
      w.className = "wire"
      const left = Math.min(x1, x2)
      const top = Math.min(y1, y2)
      const width = Math.abs(x2 - x1)
      const height = Math.abs(y2 - y1)
      w.style.left = left + "%"
      w.style.top = top + "%"
      w.style.width = Math.sqrt(width * width + height * height) + "%"
      w.style.transformOrigin = "0 0"
      const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
      w.style.transform = "rotate(" + angle + "deg)"
      box.appendChild(w)
    }

    const pts: [number, number][] = [
      [12, 28],
      [34, 46],
      [22, 72],
      [58, 30],
      [78, 52],
      [66, 74],
      [86, 22],
      [44, 58],
      [30, 40],
    ]

    pts.forEach((p) => makeNode(...p))
    for (let i = 0; i < pts.length - 1; i++) {
      makeWire(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])
    }
  }, [active])

  return (
    <main id="trueplay" className={`view ${active ? "active" : ""}`}>
      <section className="container section">
        <div className="card">
          <div className="title" style={{ fontSize: "26px" }}>
            TruePlay AI
          </div>
          <p className="lead">
            Your second player powered by data. TruePlay learns your patterns mirrors common ranked styles and simulates
            exploit heavy tactics so you adapt for real competition.
          </p>
          <div className="grid-2">
            <div className="card">
              <div className="title">How it helps you win</div>
              <p className="muted">
                Reads timing spacing movement and stamina in real time. Recreates the styles you face online so practice
                feels like ladder matches not bot drills.
              </p>
              <div className="grid-3" style={{ marginTop: "10px" }}>
                <div className="card">
                  <div className="title">Pattern mirror</div>
                  <p className="muted">Builds sparring partners from live data and uploaded matches.</p>
                </div>
                <div className="card">
                  <div className="title">Exploit sim</div>
                  <p className="muted">Tests patch era cheese and counters so you learn answers fast.</p>
                </div>
                <div className="card">
                  <div className="title">Instant cues</div>
                  <p className="muted">On screen prompts and short voice notes for timing and spacing.</p>
                </div>
              </div>
            </div>
            <div ref={scanRef} className="scan" id="tpScan"></div>
          </div>
        </div>
      </section>
    </main>
  )
}
