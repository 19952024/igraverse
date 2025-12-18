"use client"

import { useEffect, useRef } from "react"

interface HomePageProps {
  active: boolean
  onNavigate: (view: string) => void
}

export default function HomePage({ active, onNavigate }: HomePageProps) {
  const galaxyCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active) return

    // Galaxy animation
    const galaxyCanvas = galaxyCanvasRef.current
    if (!galaxyCanvas) return

    const g = galaxyCanvas.getContext("2d")
    if (!g) return

    let animationId: number
    let t = 0

    const stars = Array.from({ length: 320 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: Math.random() * 1.6 + 0.3,
      tw: Math.random() * 6,
    }))

    const comets = Array.from({ length: 3 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.65,
      vx: -1.0 - Math.random() * 1.2,
      vy: 0.08 + Math.random() * 0.18,
      len: 80 + Math.random() * 100,
    }))

    const bursts = Array.from({ length: 10 }, () => ({
      x: Math.random(),
      y: 0.35 + Math.random() * 0.6,
      r: 20 + Math.random() * 60,
      p: Math.random() * Math.PI * 2,
    }))

    const resize = () => {
      galaxyCanvas.width = galaxyCanvas.clientWidth || galaxyCanvas.parentElement?.clientWidth || 1280
      galaxyCanvas.height = galaxyCanvas.clientHeight || galaxyCanvas.parentElement?.clientHeight || 600
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(galaxyCanvas)
    resize()

    const draw = () => {
      t += 0.016
      const w = galaxyCanvas.width
      const h = galaxyCanvas.height
      g.clearRect(0, 0, w, h)

      // Star field
      for (const s of stars) {
        const a = 0.35 + 0.35 * Math.sin(t * 2.2 + s.tw)
        g.fillStyle = `rgba(190,235,255,${a})`
        g.fillRect(s.x * w, s.y * h, s.s, s.s)
      }

      // Aurora ribbons
      g.save()
      g.globalCompositeOperation = "screen"
      for (let k = 0; k < 3; k++) {
        g.beginPath()
        for (let x = 0; x <= w; x += 8) {
          const y = h * 0.18 + Math.sin(x * 0.005 + t * 1.0 + k) * 22 + Math.sin(x * 0.01 - t * 0.8) * 10 + k * 18
          if (x === 0) g.moveTo(x, y)
          else g.lineTo(x, y)
        }
        g.strokeStyle = `rgba(56,189,248,0.08)`
        g.lineWidth = 14
        g.stroke()
        g.strokeStyle = `rgba(34,197,94,0.22)`
        g.lineWidth = 2
        g.stroke()
      }
      g.restore()

      // Comets
      for (const c of comets) {
        c.x += c.vx / 100
        c.y += c.vy / 100
        if (c.x < -0.2) {
          c.x = 1.2
          c.y = Math.random() * 0.6
        }
        const tx = c.x * w
        const ty = c.y * h
        const grad = g.createLinearGradient(tx, ty, tx + c.len, ty - c.len * 0.2)
        grad.addColorStop(0, "rgba(255,255,255,0.9)")
        grad.addColorStop(1, "rgba(56,189,248,0)")
        g.strokeStyle = grad
        g.lineWidth = 2
        g.beginPath()
        g.moveTo(tx, ty)
        g.lineTo(tx + c.len, ty - c.len * 0.2)
        g.stroke()
      }

      // Soft world glows
      for (const b of bursts) {
        const cx = b.x * w
        const cy = b.y * h
        const rr = b.r * (1 + 0.15 * Math.sin(t * 1.3 + b.p))
        const glow = g.createRadialGradient(cx, cy, 0, cx, cy, rr)
        glow.addColorStop(0, "rgba(34,197,94,0.14)")
        glow.addColorStop(1, "rgba(56,189,248,0)")
        g.fillStyle = glow
        g.beginPath()
        g.arc(cx, cy, rr, 0, Math.PI * 2)
        g.fill()
      }

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
    }
  }, [active])

  return (
    <main id="home" className={`view ${active ? "active" : ""}`}>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1 className="display">
              <span className="pop">Igraverse</span> The AI Engine of the Gaming World
            </h1>
            <p className="mission-hero-small">
              Igraverse is building the future of gaming through artificial intelligence, creating tools that help
              developers make games faster and smarter, give players real AI driven coaching, and unlock entirely new
              ways for games to be created and experienced.
            </p>
          </div>
          <canvas ref={galaxyCanvasRef} id="heroGalaxy" className="hero-galaxy" aria-hidden="true"></canvas>
        </div>
      </section>

      <section className="container section">
        <div className="grid-3">
          <div className="card feature">
            <div className="title">MetaBuffed</div>
            <p className="muted grow">
              MetaBuffed helps gamers reach their full potential through real gameplay analysis giving accurate AI
              coaching based on live online competition and evolving game metas.
            </p>
            <a className="btn" onClick={() => onNavigate("metabuffed")}>
              Enter
            </a>
          </div>
          <div className="card feature">
            <div className="title">TruePlay AI</div>
            <p className="muted grow">
              TruePlay AI recreates real opponents playstyles through artificial intelligence, letting gamers train
              against lifelike versions of the players they face online to improve faster and smarter.
            </p>
            <a className="btn" onClick={() => onNavigate("trueplay")}>
              Enter
            </a>
          </div>
          <div className="card feature">
            <div className="title">Dev Tools</div>
            <p className="muted grow">
              Dev Tools empower developers with AI systems that automate asset creation rigging logic building and
              testing to make game development faster smarter and more accessible.
            </p>
            <a className="btn" onClick={() => onNavigate("devtools")}>
              Coming Soon
            </a>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="card center">
          <div className="title" style={{ fontSize: "24px" }}>
            Game Generation
          </div>
          <p className="muted">
            Describe a world or a mode and watch a playable build come together in minutes. This is the bridge from
            gamer to studio.
          </p>
          <a className="btn" onClick={() => onNavigate("gamegen")}>
            Enter
          </a>
        </div>
      </section>
    </main>
  )
}
