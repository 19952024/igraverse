"use client"

import { useEffect, useRef } from "react"
import { toast } from "@/components/ui/use-toast"

interface MetaBuffedPageProps {
  active: boolean
}

export default function MetaBuffedPage({ active }: MetaBuffedPageProps) {
  const starsCanvasRef = useRef<HTMLCanvasElement>(null)
  const selectedGameRef = useRef<string>("UFC 5")

  useEffect(() => {
    if (!active) return

    const canvas = starsCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let w: number, h: number

    const resize = () => {
      const b = canvas.getBoundingClientRect()
      w = canvas.width = b.width
      h = canvas.height = b.height
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()

    const P = 140
    const pts = Array.from({ length: P }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      s: Math.random() * 1.6 + 0.4,
      vx: (Math.random() * 2 - 1) * 0.12,
      vy: (Math.random() * 2 - 1) * 0.12,
    }))

    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of pts) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
        ctx.beginPath()
        ctx.fillStyle = "rgba(160,220,255,.12)"
        ctx.arc(p.x, p.y, p.s, 0, 6.283)
        ctx.fill()
      }
      animationId = requestAnimationFrame(tick)
    }

    tick()

    return () => {
      cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
    }
  }, [active])

  useEffect(() => {
    if (!active) return

    const analyzeBtn = document.getElementById("analyzeBtn") as HTMLButtonElement | null
    const uploadBtn = document.getElementById("uploadBtn") as HTMLButtonElement | null
    const chatSend = document.getElementById("chatSend") as HTMLButtonElement | null
    const chatClear = document.getElementById("chatClear") as HTMLButtonElement | null
    const analysisClear = document.getElementById("analysisClear") as HTMLButtonElement | null
    const linkIn = document.getElementById("linkIn") as HTMLInputElement | null
    const chatInput = document.getElementById("chatInput") as HTMLInputElement | null
    const chatWindow = document.getElementById("chatWindow") as HTMLDivElement | null
    const analysisFeed = document.getElementById("analysisFeed") as HTMLDivElement | null
    const gameSelect = document.getElementById("gameSelect") as HTMLSelectElement | null

    if (!chatWindow) return

    const getSelectedGame = () => selectedGameRef.current

    const appendChat = (role: "You" | "Coach", text: string, id?: string) => {
      const row = document.createElement("div")
      row.style.display = "flex"
      row.style.gap = "10px"
      row.style.marginBottom = "14px"
      if (role === "Coach") row.style.flexDirection = "row-reverse"
      const avatar = document.createElement("div")
      avatar.style.flex = "0 0 34px"
      avatar.style.height = "34px"
      avatar.style.borderRadius = "50%"
      avatar.style.background = role === "Coach" ? "rgba(34,197,94,.25)" : "rgba(56,189,248,.25)"
      const bubble = document.createElement("div")
      bubble.style.background = role === "Coach" ? "linear-gradient(180deg,rgba(56,189,248,.18),rgba(56,189,248,.05))" : "rgba(255,255,255,.06)"
      bubble.style.border = role === "Coach" ? "1px solid rgba(125,211,252,.45)" : "1px solid rgba(255,255,255,.10)"
      bubble.style.borderRadius = "14px"
      bubble.style.padding = "10px 12px"
      bubble.style.maxWidth = "85%"
      bubble.style.position = "relative"
      const who = document.createElement("div")
      who.style.opacity = "0.8"
      who.style.fontSize = "13px"
      who.style.marginBottom = "2px"
      who.innerText = role
      const textDiv = document.createElement("div")
      textDiv.innerText = text
      bubble.appendChild(who)
      bubble.appendChild(textDiv)
      if (id) {
        row.dataset.msgid = id
        const del = document.createElement("button")
        del.innerHTML = "×"
        del.style.position = "absolute"
        del.style.top = "4px"
        del.style.right = "4px"
        del.style.width = "20px"
        del.style.height = "20px"
        del.style.display = "flex"
        del.style.alignItems = "center"
        del.style.justifyContent = "center"
        del.style.background = "rgba(239,68,68,.2)"
        del.style.border = "1px solid rgba(239,68,68,.4)"
        del.style.borderRadius = "50%"
        del.style.color = "#fff"
        del.style.cursor = "pointer"
        del.style.fontSize = "16px"
        del.style.fontWeight = "bold"
        del.style.opacity = "0.8"
        del.style.transition = "all 0.2s"
        del.title = "Delete message"
        del.onmouseenter = () => {
          del.style.opacity = "1"
          del.style.background = "rgba(239,68,68,.4)"
          del.style.transform = "scale(1.1)"
        }
        del.onmouseleave = () => {
          del.style.opacity = "0.8"
          del.style.background = "rgba(239,68,68,.2)"
          del.style.transform = "scale(1)"
        }
        del.onclick = async (e) => {
          e.stopPropagation()
          try {
            const sid = getSessionId()
            const res = await fetch(`/api/chat/history?sessionId=${encodeURIComponent(sid)}&messageId=${encodeURIComponent(id)}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed")
            row.style.opacity = "0"
            row.style.transition = "opacity 0.3s"
            setTimeout(() => row.remove(), 300)
            toast({ title: "Message deleted", description: "Message removed from chat" })
          } catch (e: any) {
            toast({ title: "Delete failed", description: e?.message || "Please try again" })
          }
        }
        bubble.appendChild(del)
      }
      row.appendChild(avatar)
      row.appendChild(bubble)
      chatWindow.appendChild(row)
      chatWindow.scrollTop = chatWindow.scrollHeight
    }

    const renderEvent = (event: any, analysisId?: string, idx?: number) => {
      if (!analysisFeed) return
      const card = document.createElement("div")
      card.className = "card"
      ;(card.style as any).padding = "16px"
      card.style.position = "relative"
      
      const t = event.timecode || 0
      const mm = String(Math.floor(t / 60)).padStart(2, "0")
      const ss = String(t % 60).padStart(2, "0")
      
      // Timestamp at top
      const ts = document.createElement("div")
      ts.style.opacity = "0.8"
      ts.style.fontSize = "13px"
      ts.style.marginBottom = "6px"
      ts.style.fontWeight = "600"
      ts.innerText = t > 0 ? `${mm}:${ss}` : "Start"
      
      // Title
      const title = document.createElement("div")
      title.style.fontWeight = "800"
      title.style.marginBottom = "12px"
      title.style.fontSize = "16px"
      title.style.color = "#fff"
      title.innerText = event.label || "Key Event"
      
      // Add timestamp and title first
      card.appendChild(ts)
      card.appendChild(title)
      
      if (event.whatHappened) {
        const whatDiv = document.createElement("div")
        whatDiv.style.marginBottom = "8px"
        whatDiv.style.fontSize = "13px"
        whatDiv.style.opacity = "0.9"
        whatDiv.innerHTML = `<strong>What happened:</strong> ${event.whatHappened}`
        card.appendChild(whatDiv)
      }
      
      if (event.whyOnline) {
        const whyDiv = document.createElement("div")
        whyDiv.style.marginBottom = "8px"
        whyDiv.style.fontSize = "13px"
        whyDiv.style.opacity = "0.85"
        whyDiv.style.color = "#7dd3fc"
        whyDiv.innerHTML = `<strong>Why online:</strong> ${event.whyOnline}`
        card.appendChild(whyDiv)
      }
      
      if (event.whatToDo) {
        const doDiv = document.createElement("div")
        doDiv.style.marginBottom = "8px"
        doDiv.style.fontSize = "13px"
        doDiv.style.opacity = "0.9"
        doDiv.style.color = "#22c55e"
        doDiv.innerHTML = `<strong>What to do:</strong> ${event.whatToDo}`
        card.appendChild(doDiv)
      }
      
      if (event.drill) {
        const drillDiv = document.createElement("div")
        drillDiv.style.marginTop = "10px"
        drillDiv.style.padding = "8px"
        drillDiv.style.background = "rgba(56,189,248,.08)"
        drillDiv.style.borderRadius = "6px"
        drillDiv.style.fontSize = "12px"
        drillDiv.style.opacity = "0.9"
        drillDiv.innerHTML = `<strong>Drill:</strong> ${event.drill}`
        card.appendChild(drillDiv)
      }
      
      if (event.hudReads) {
        const hudDiv = document.createElement("div")
        hudDiv.style.marginTop = "8px"
        hudDiv.style.fontSize = "11px"
        hudDiv.style.opacity = "0.7"
        const hudParts: string[] = []
        if (event.hudReads.stamina !== undefined) hudParts.push(`Stamina: ${event.hudReads.stamina}%`)
        if (event.hudReads.health !== undefined) hudParts.push(`Health: ${event.hudReads.health}%`)
        if (event.hudReads.timer !== undefined) hudParts.push(`Time: ${mm}:${ss}`)
        hudDiv.innerText = hudParts.join(" · ")
        card.appendChild(hudDiv)
      }
      
      // Feedback buttons
      if (analysisId && typeof idx === "number") {
        const feedbackDiv = document.createElement("div")
        feedbackDiv.style.display = "flex"
        feedbackDiv.style.gap = "8px"
        feedbackDiv.style.marginTop = "12px"
        feedbackDiv.style.paddingTop = "12px"
        feedbackDiv.style.borderTop = "1px solid rgba(255,255,255,.1)"
        
        const helpedBtn = document.createElement("button")
        helpedBtn.innerText = "✓ Helped"
        helpedBtn.style.padding = "6px 12px"
        helpedBtn.style.background = "rgba(34,197,94,.15)"
        helpedBtn.style.border = "1px solid rgba(34,197,94,.3)"
        helpedBtn.style.borderRadius = "6px"
        helpedBtn.style.color = "#22c55e"
        helpedBtn.style.fontSize = "12px"
        helpedBtn.style.cursor = "pointer"
        helpedBtn.onclick = async () => {
          try {
            await fetch("/api/feedback", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ analysisId, eventIndex: idx, timecode: t, helped: true, sessionId: getSessionId() }),
            })
            helpedBtn.style.opacity = "0.6"
            helpedBtn.disabled = true
          } catch {}
        }
        
        const notHelpedBtn = document.createElement("button")
        notHelpedBtn.innerText = "✗ Not helped"
        notHelpedBtn.style.padding = "6px 12px"
        notHelpedBtn.style.background = "rgba(239,68,68,.15)"
        notHelpedBtn.style.border = "1px solid rgba(239,68,68,.3)"
        notHelpedBtn.style.borderRadius = "6px"
        notHelpedBtn.style.color = "#ef4444"
        notHelpedBtn.style.fontSize = "12px"
        notHelpedBtn.style.cursor = "pointer"
        notHelpedBtn.onclick = async () => {
          try {
            await fetch("/api/feedback", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ analysisId, eventIndex: idx, timecode: t, helped: false, sessionId: getSessionId() }),
            })
            notHelpedBtn.style.opacity = "0.6"
            notHelpedBtn.disabled = true
          } catch {}
        }
        
        feedbackDiv.appendChild(helpedBtn)
        feedbackDiv.appendChild(notHelpedBtn)
        card.appendChild(feedbackDiv)
      }
      
      analysisFeed.appendChild(card)
    }

    const renderHeader = (sourceInfo: any, stats: any, summary: string) => {
      if (!analysisFeed) return
      const header = document.createElement("div")
      header.className = "card"
      ;(header.style as any).padding = "12px"
      const title = document.createElement("div")
      title.style.fontWeight = "800"
      title.textContent = "This Video"
      const src = document.createElement("div")
      src.style.opacity = "0.8"
      src.style.fontSize = "13px"
      if (sourceInfo?.type === 'link') {
        src.textContent = `Source: ${sourceInfo.host || 'unknown'}${sourceInfo.path || ''}`
      } else if (sourceInfo?.id) {
        src.textContent = `Upload: ${sourceInfo.id.slice(0, 8)}…`
      } else if (sourceInfo?.type === 'upload') {
        src.textContent = `Upload: MP4 file`
      } else {
        src.textContent = `Video analysis`
      }
      const stat = document.createElement("div")
      stat.className = "lead"
      const s = stats || {}
      stat.textContent = `Accuracy ${Math.round((s.accuracy||0)*100)}% · Efficiency ${Math.round((s.efficiency||0)*100)}% · IQ ${Math.round((s.iq||0)*100)}% · Momentum ${s.momentumSwings||0}`
      const sum = document.createElement("div")
      sum.style.marginTop = '8px'
      sum.style.padding = "10px"
      sum.style.background = "rgba(255,255,255,.03)"
      sum.style.borderRadius = "8px"
      sum.style.fontSize = "13px"
      sum.style.lineHeight = "1.5"
      sum.style.opacity = "0.9"
      sum.textContent = summary || 'Analysis complete'
      header.appendChild(title)
      header.appendChild(src)
      header.appendChild(stat)
      header.appendChild(sum)
      analysisFeed.appendChild(header)
    }

    // Ensure a stable session id for Ask-a-Coach history
    const getSessionId = () => {
      try {
        const k = "mb_sessionId"
        const existing = localStorage.getItem(k)
        if (existing) return existing
        const id = (crypto as any).randomUUID ? (crypto as any).randomUUID() : String(Date.now())
        localStorage.setItem(k, id)
        return id
      } catch {
        return "local"
      }
    }

    const doAnalyze = async () => {
      try {
        const link = linkIn?.value?.trim()
        const uploadId = (analysisFeed as HTMLDivElement | null)?.dataset?.uploadId
        if (!link && !uploadId) {
          appendChat("Coach", "Paste a video link or upload an MP4 first.")
          return
        }
        toast({ title: "Analyzing video", description: link ? "Using provided link" : "Using uploaded MP4" })
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            link
              ? { game: getSelectedGame(), link, sessionId: getSessionId() }
              : { game: getSelectedGame(), uploadId, sessionId: getSessionId() }
          ),
        })
        const data = await res.json()
        if (!res.ok) {
          appendChat("Coach", data.error || "Could not analyze that input. Provide a valid link or upload.")
          toast({ title: "Analyze failed", description: data.error || "Please try again." })
          return
        }
        ;(analysisFeed as HTMLDivElement).innerHTML = ""
        renderHeader(data.report?.sourceInfo, data.report?.stats, data.report?.summary)
        data.report?.events?.forEach((e: any, idx: number) => {
          renderEvent(e, data.analysisId, idx)
        })
        ;(analysisFeed as HTMLDivElement).dataset.analysisId = data.analysisId
        if (data.keyMoment) {
          ;(analysisFeed as HTMLDivElement).dataset.keyLabel = data.keyMoment.label || ""
          ;(analysisFeed as HTMLDivElement).dataset.keyTime = String(data.keyMoment.timecode || 0)
        }
        toast({ title: "Analysis complete", description: "Key moments extracted." })
      } catch (e: any) {
        appendChat("Coach", "Analyze failed. Try a valid link or upload an MP4.")
        toast({ title: "Analyze failed", description: e?.message || "Unexpected error" })
      }
    }

    const doUpload = async () => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "video/mp4"
      input.onchange = async () => {
        if (!input.files || input.files.length === 0) return
        const fd = new FormData()
        fd.append("file", input.files[0])
        toast({ title: "Uploading MP4", description: input.files[0].name })
        const up = await fetch("/api/upload", { method: "POST", body: fd })
        const upData = await up.json()
        if (!up.ok) {
          toast({ title: "Upload failed", description: upData.error || "Try another file." })
          throw new Error(upData.error || "Upload failed")
        }
        ;(analysisFeed as HTMLDivElement).dataset.uploadId = upData.uploadId
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ game: getSelectedGame(), uploadId: upData.uploadId, sessionId: getSessionId() }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast({ title: "Analyze failed", description: data.error || "Please try again." })
          throw new Error(data.error || "Failed")
        }
        ;(analysisFeed as HTMLDivElement).innerHTML = ""
        renderHeader(data.report?.sourceInfo, data.report?.stats, data.report?.summary)
        data.report?.events?.forEach((e: any, idx: number) => {
          renderEvent(e, data.analysisId, idx)
        })
        ;(analysisFeed as HTMLDivElement).dataset.analysisId = data.analysisId
        if (data.keyMoment) {
          ;(analysisFeed as HTMLDivElement).dataset.keyLabel = data.keyMoment.label || ""
          ;(analysisFeed as HTMLDivElement).dataset.keyTime = String(data.keyMoment.timecode || 0)
        }
        toast({ title: "Upload successful", description: "Analyzing your video now." })
      }
      input.click()
    }

    const doChat = async () => {
      const q = chatInput?.value?.trim()
      if (!q) return
      const feed = (analysisFeed as HTMLDivElement | null)
      const analysisId = feed?.dataset?.analysisId
      const keyMoment = feed ? { label: feed.dataset.keyLabel, timecode: Number(feed.dataset.keyTime || 0) } : undefined
      toast({ title: "Coach is thinking", description: "Composing an answer..." })
      chatInput!.value = ""
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, game: getSelectedGame(), analysisId, keyMoment, sessionId: getSessionId() }),
      })
      const data = await res.json()
      if (!res.ok) {
        appendChat("Coach", data.error || "Something went wrong")
        toast({ title: "Chat failed", description: data.error || "Please try again." })
      } else {
        appendChat("You", q, data.userMessageId || undefined)
        appendChat("Coach", data.content, data.messageId)
        toast({ title: "Coach replied", description: "Answer added to chat" })
      }
    }

    if (gameSelect) {
      gameSelect.value = selectedGameRef.current
      gameSelect.addEventListener("change", (e: Event) => {
        const t = e.target as HTMLSelectElement
        selectedGameRef.current = t.value
      })
    }

    const chatMic = document.getElementById("chatMic") as HTMLButtonElement | null
    
    const doVoiceInput = async () => {
      if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        appendChat("Coach", "Voice input is not supported in your browser. Please type your question.")
        toast({ title: "Voice not supported", description: "Your browser doesn't support speech recognition" })
        return
      }
      
      const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new Recognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"
      
      chatMic!.textContent = "🎤 Listening..."
      chatMic!.style.background = "rgba(239,68,68,.2)"
      chatMic!.style.borderColor = "rgba(239,68,68,.4)"
      
      recognition.onstart = () => {
        toast({ title: "Listening", description: "Speak your question..." })
      }
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        if (chatInput) {
          chatInput.value = transcript
        }
        chatMic!.textContent = "🎤"
        chatMic!.style.background = ""
        chatMic!.style.borderColor = ""
        recognition.stop()
      }
      
      recognition.onerror = (event: any) => {
        appendChat("Coach", "Voice input error. Please try typing instead.")
        chatMic!.textContent = "🎤"
        chatMic!.style.background = ""
        chatMic!.style.borderColor = ""
        toast({ title: "Voice error", description: event.error || "Please try again" })
        recognition.stop()
      }
      
      recognition.onend = () => {
        chatMic!.textContent = "🎤"
        chatMic!.style.background = ""
        chatMic!.style.borderColor = ""
      }
      
      recognition.start()
    }

    analyzeBtn?.addEventListener("click", doAnalyze)
    uploadBtn?.addEventListener("click", doUpload)
    chatSend?.addEventListener("click", doChat)
    chatMic?.addEventListener("click", doVoiceInput)
    chatInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        doChat()
      }
    })
    chatClear?.addEventListener("click", async () => {
      try {
        const sid = getSessionId()
        const res = await fetch(`/api/chat/history?sessionId=${encodeURIComponent(sid)}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Failed to clear history")
        if (chatWindow) chatWindow.innerHTML = ""
        toast({ title: "Chat cleared", description: "Conversation history deleted" })
      } catch (e: any) {
        toast({ title: "Failed to clear", description: e?.message || "Please try again" })
      }
    })

    // On mount, load the latest analysis for this session so refresh shows past data
    ;(async () => {
      try {
        const sid = getSessionId()
        const res = await fetch(`/api/analysis/latest?sessionId=${encodeURIComponent(sid)}`)
        if (!res.ok) return
        const data = await res.json()
        if (data?.analysis) {
          ;(analysisFeed as HTMLDivElement).innerHTML = ""
          renderHeader(data.analysis.sourceInfo, data.analysis.stats, data.analysis.summary)
          data.analysis.events?.forEach((e: any, idx: number) => renderEvent(e, data.analysisId, idx))
          ;(analysisFeed as HTMLDivElement).dataset.analysisId = data.analysisId
          if (data.analysis.events?.[0]) {
            ;(analysisFeed as HTMLDivElement).dataset.keyLabel = data.analysis.events[0].label || ""
            ;(analysisFeed as HTMLDivElement).dataset.keyTime = String(data.analysis.events[0].timecode || 0)
          }
        }
      } catch {}
    })()

    // Load chat history for this session so the conversation persists across refreshes
    ;(async () => {
      try {
        if (!chatWindow) return
        chatWindow.innerHTML = ""
        const sid = getSessionId()
        const res = await fetch(`/api/chat/history?sessionId=${encodeURIComponent(sid)}&limit=50`)
        if (!res.ok) return
        const data = await res.json()
        const msgs: { id?: string; role: string; content: string }[] = data?.messages || []
        for (const m of msgs) {
          appendChat(m.role === "assistant" ? "Coach" : "You", m.content, m.id)
        }
      } catch {}
    })()

    const handleAnalysisClear = async () => {
      try {
        const sid = getSessionId()
        const feed = analysisFeed as HTMLDivElement | null
        const analysisId = feed?.dataset?.analysisId

        const url = analysisId
          ? `/api/analysis/history?sessionId=${encodeURIComponent(sid)}&analysisId=${encodeURIComponent(analysisId)}`
          : `/api/analysis/history?sessionId=${encodeURIComponent(sid)}`

        const res = await fetch(url, { method: "DELETE" })
        if (!res.ok) throw new Error("Failed to clear history")

        if (feed) {
          feed.innerHTML = ""
          delete feed.dataset.analysisId
          delete feed.dataset.keyLabel
          delete feed.dataset.keyTime
          delete feed.dataset.uploadId
        }
        toast({ title: "Analysis cleared", description: analysisId ? "Analysis deleted" : "All analyses for this session deleted" })
      } catch (e: any) {
        toast({ title: "Failed to clear", description: e?.message || "Please try again" })
      }
    }

    analysisClear?.addEventListener("click", handleAnalysisClear)

    return () => {
      analyzeBtn?.removeEventListener("click", doAnalyze)
      uploadBtn?.removeEventListener("click", doUpload)
      chatSend?.removeEventListener("click", doChat)
      chatClear?.removeEventListener("click", () => {})
      analysisClear?.removeEventListener("click", handleAnalysisClear)
    }
  }, [active])

  return (
    <main id="metabuffed" className={`view ${active ? "active" : ""}`}>
      <section className="container section">
        <div className="title" style={{ fontSize: "30px" }}>
          MetaBuffed
        </div>
        <p className="lead">
          Upload or stream first. Your analysis appears below in a clean report with time stamped callouts and meta
          tuned tips.
        </p>

        <div className="deck">
          <canvas ref={starsCanvasRef} id="mb-stars" className="starfield"></canvas>
          <div className="z1">
            <div className="drop" id="dropzone">
              <div style={{ fontWeight: 900, fontSize: "18px", marginBottom: "4px" }}>Drop your MP4 here</div>
              <div style={{ opacity: 0.85, marginBottom: "12px" }}>Or paste a link from YouTube or Twitch</div>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    opacity: 0.85,
                    marginBottom: "6px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Select Game
                </label>
                <select
                  id="gameSelect"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(255,255,255,.05)",
                    border: "1px solid rgba(125,211,252,.3)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                  defaultValue="UFC 5"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(125,211,252,.5)"
                    e.currentTarget.style.background = "rgba(255,255,255,.08)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(125,211,252,.3)"
                    e.currentTarget.style.background = "rgba(255,255,255,.05)"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(125,211,252,.6)"
                    e.currentTarget.style.background = "rgba(255,255,255,.08)"
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(125,211,252,.15)"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(125,211,252,.3)"
                    e.currentTarget.style.background = "rgba(255,255,255,.05)"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  <option value="UFC 5" style={{ background: "#1a1a2e", color: "#fff" }}>
                    UFC 5
                  </option>
                  <option value="NBA 2K26" style={{ background: "#1a1a2e", color: "#fff" }}>
                    NBA 2K26
                  </option>
                  <option value="FIGHT NIGHT CHAMPION" style={{ background: "#1a1a2e", color: "#fff" }}>
                    FIGHT NIGHT CHAMPION
                  </option>
                  <option value="UNDISPUTED" style={{ background: "#1a1a2e", color: "#fff" }}>
                    UNDISPUTED
                  </option>
                  <option value="MADDEN 26" style={{ background: "#1a1a2e", color: "#fff" }}>
                    MADDEN 26
                  </option>
                </select>
              </div>
              <div className="row">
                <input id="linkIn" className="in" placeholder="Paste your video link" />
                <button className="btn" id="analyzeBtn">
                  Analyze
                </button>
                <button className="btn" id="uploadBtn">
                  Upload MP4
                </button>
                <button className="btn" id="liveBtn">
                  Connect Stream
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: "22px", alignItems: "start" }}>
          <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
            <div
              style={{
                padding: "16px 18px",
                borderBottom: "1px solid rgba(255,255,255,.12)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#38bdf8",
                  boxShadow: "0 0 12px rgba(56,189,248,.9)",
                }}
              ></div>
              <div className="title" style={{ margin: 0 }}>
                Ask a Coach
              </div>
            </div>
            <div
              id="chatWindow"
              style={{
                flex: 1,
                overflow: "auto",
                padding: "16px",
                paddingRight: "8px",
                background: "linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.02))",
                minHeight: 0,
                maxHeight: "calc(100vh - 280px)",
              }}
            >
              <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
                <div
                  style={{
                    flex: "0 0 34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "rgba(56,189,248,.25)",
                  }}
                ></div>
                <div
                  style={{
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,255,255,.10)",
                    borderRadius: "14px",
                    padding: "10px 12px",
                    maxWidth: "85%",
                  }}
                >
                  <div style={{ opacity: 0.8, fontSize: "13px", marginBottom: "2px" }}>You</div>
                  <div>How do I stop paint mashing in 2K</div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "14px",
                  flexDirection: "row-reverse",
                }}
              >
                <div
                  style={{
                    flex: "0 0 34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "rgba(34,197,94,.25)",
                  }}
                ></div>
                <div
                  style={{
                    background: "linear-gradient(180deg,rgba(56,189,248,.18),rgba(56,189,248,.05))",
                    border: "1px solid rgba(125,211,252,.45)",
                    borderRadius: "14px",
                    padding: "10px 12px",
                    maxWidth: "85%",
                  }}
                >
                  <div style={{ opacity: 0.8, fontSize: "13px", marginBottom: "2px" }}>Coach</div>
                  <div>
                    Bait with a half step then hold position. Force switches after three possessions and make them
                    finish over hands. Stagger help from the weak side to kill the mash rhythm.
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{
                padding: "12px",
                borderTop: "1px solid rgba(255,255,255,.10)",
                display: "flex",
                gap: "8px",
                flexShrink: 0,
              }}
            >
              <input
                id="chatInput"
                className="in"
                placeholder="Ask anything about matchups timing rotations counters"
                style={{ 
                  flex: 1, 
                  minWidth: "350px", 
                  padding: "5px 10px", 
                  fontSize: "15px",
                  width: "100%"
                }}
              />
              <button className="btn" id="chatSend" style={{ flexShrink: 0 }}>
                Send
              </button>
              <button className="btn" id="chatMic" title="Voice input - click to speak your question" style={{ flexShrink: 0, padding: "12px 16px" }}>
                🎤
              </button>
              <button className="btn" id="chatClear" style={{ flexShrink: 0 }}>
                Clear
              </button>
            </div>
          </div>

          <div className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
            <div
              style={{
                padding: "16px 18px",
                borderBottom: "1px solid rgba(255,255,255,.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#38bdf8",
                    boxShadow: "0 0 12px rgba(56,189,248,.9)",
                  }}
                ></div>
                <div className="title" style={{ margin: 0 }}>
                  Analysis Feed
                </div>
              </div>
              <button className="btn" id="analysisClear" style={{ flexShrink: 0, padding: "8px 16px", fontSize: "13px" }}>
                Clear
              </button>
            </div>
            <p className="lead" style={{ marginTop: "6px", paddingLeft: "18px", paddingRight: "18px" }}>
              Preview key moments meta tips and momentum shifts.
            </p>
            <div
              id="analysisFeed"
              style={{
                marginTop: "10px",
                paddingLeft: "18px",
                paddingRight: "18px",
                display: "grid",
                gap: "12px",
                maxHeight: "calc(100vh - 280px)",
                minHeight: "400px",
                overflowY: "auto",
                overflowX: "hidden",
                paddingBottom: "18px",
              }}
            ></div>
          </div>
        </div>
      </section>
    </main>
  )
}
