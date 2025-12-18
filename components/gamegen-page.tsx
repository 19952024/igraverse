"use client"

import { useEffect, useRef } from "react"

interface GameGenPageProps {
  active: boolean
}

export default function GameGenPage({ active }: GameGenPageProps) {
  const fxCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active) return

    const canvas = fxCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let t = 0

    const resize = () => {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()

    const stars = Array.from({ length: 140 }, () => ({
      x: Math.random(),
      y: Math.random(),
      v: 0.06 + 0.08 * Math.random(),
    }))

    const sparks = Array.from({ length: 40 }, () => ({
      p: Math.random() * Math.PI * 2,
      r: 0.18 + 0.68 * Math.random(),
      w: 1 + Math.random() * 2,
    }))

    const draw = () => {
      t += 0.016
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      // Gradient wash
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, "#050a16")
      g.addColorStop(0.5, "#08172c")
      g.addColorStop(1, "#071b23")
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      // Stars
      ctx.fillStyle = "rgba(190,235,255,.55)"
      for (const s of stars) {
        const px = (s.x + t * s.v * 0.02) % 1
        const py = (s.y + Math.sin(t * 0.2 + s.x * 8) * 0.0008) % 1
        ctx.globalAlpha = 0.25 + 0.25 * Math.sin(t * 2 + s.x * 8)
        ctx.fillRect(px * w, py * h, 1.5, 1.5)
      }
      ctx.globalAlpha = 1

      // Orbit sparks
      ctx.save()
      ctx.translate(w * 0.5, h * 0.46)
      for (const sp of sparks) {
        const ang = sp.p + t * 0.35
        const rx = w * 0.35
        const ry = h * 0.2
        const sx = Math.cos(ang) * rx
        const sy = Math.sin(ang) * ry
        const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, 24)
        grd.addColorStop(0, "rgba(56,189,248,.25)")
        grd.addColorStop(1, "rgba(56,189,248,0)")
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(sx, sy, 24, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "rgba(34,197,94,.9)"
        ctx.fillRect(sx - 0.8, sy - 0.8, sp.w, sp.w)
      }
      ctx.restore()

      // Scanlines
      ctx.globalAlpha = 0.08
      ctx.fillStyle = "#ffffff"
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1)
      }
      ctx.globalAlpha = 1

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
    }
  }, [active])

  return (
    <main id="gamegen" className={`view ${active ? "active" : ""}`}>
      <section className="container section">
        <div className="gg-hero">
          <canvas ref={fxCanvasRef} id="ggFX"></canvas>
          <div className="gg-inner">
            <h2 className="gg-title center">Game Generation</h2>
            <p className="gg-lead center">
              Igraverse is creating a new era of gaming where imagination becomes the controller. With our game
              generation platform anyone can describe an idea and watch it transform into a fully playable experience
              complete with menus, AI opponents, environments, soundtracks, and more. Every detail can be shaped,
              refined, and customized through AI letting users design games scene by scene or create entire worlds in
              one go. Players can build, share, and even sell their creations turning passion into opportunity. This is
              not just a tool it is a revolution that turns gamers into creators and makes the future of play limitless.
            </p>

            <div className="gg-prompt">
              <input className="gg-input" placeholder="Describe your game" />
              <button className="gg-pill">Enter</button>
              <button className="gg-pill">Notify me when it is ready</button>
            </div>
            <div className="gg-hints">
              <span className="gg-hint">A street boxing story in futuristic Tokyo</span>
              <span className="gg-hint">A basketball simulation with real player emotion</span>
              <span className="gg-hint">An open world survival on Mars</span>
            </div>

            <div className="gg-grid">
              <div className="gg-card">
                <div className="t">Characters and AI</div>
                <div className="muted">
                  Generate fighters teammates rivals and crowd behavior with real tendencies and emotion.
                </div>
              </div>
              <div className="gg-card">
                <div className="t">Worlds and Physics</div>
                <div className="muted">
                  Forge arenas streets stadiums and materials with grounded movement collisions and ballistics.
                </div>
              </div>
              <div className="gg-card">
                <div className="t">Logic and Systems</div>
                <div className="muted">Create rules objectives menus cameras audio and HUD with natural language.</div>
              </div>
            </div>

            <div className="gg-steps">
              <div className="gg-step">
                <div className="n">Step 1</div>
                <div className="muted">Type an idea and preview a scene with placeholder art and core mechanics.</div>
              </div>
              <div className="gg-step">
                <div className="n">Step 2</div>
                <div className="muted">Refine characters worlds and logic piece by piece using short prompts.</div>
              </div>
              <div className="gg-step">
                <div className="n">Step 3</div>
                <div className="muted">Auto build menus AI opponents soundtracks cameras and effects.</div>
              </div>
              <div className="gg-step">
                <div className="n">Step 4</div>
                <div className="muted">Play share or sell your creation in the Igraverse library.</div>
              </div>
            </div>

            <div className="gg-cta">
              <button className="gg-pill">Enter</button>
              <button className="gg-pill">Notify me when it is ready</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
