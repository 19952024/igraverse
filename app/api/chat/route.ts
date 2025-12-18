import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { ChatMessage } from "@/models/ChatMessage"
import { Analysis } from "@/models/Analysis"
import { MetaRule } from "@/models/MetaRule"
import { getFallbackRules } from "@/lib/fallback"
import OpenAI from "openai"

export const runtime = "nodejs"

// Mapping-only mode per client request: detect → match rule cards → template output
const MAPPING_ONLY = true

function buildCoachTone(answer: string) {
	return answer.replace(/\s+/g, " ").trim()
}

function tokenize(text: string): string[] {
	return (text || "")
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.split(/\s+/)
		.filter(Boolean)
}

// Sanitize wording per game to avoid incorrect terminology
function sanitizeForGame(game: string | undefined, text: string): string {
    if (!game) return text
    let out = text
    if (game === "FIGHT NIGHT CHAMPION") {
        const replacements: [RegExp, string][] = [
            [/power\s*chain(s)?/gi, "back-to-back power shots"],
            [/cap\s*exchanges?/gi, "keep it to 1–2 taps then move"],
            [/enter\s*off-?angle/gi, "walk on the outside lane"],
            [/punish\s*when (they('|’)re|they are) low on stam/gi, "punish when you have timing and safe range"],
            [/bait\s*distance\s*entries/gi, "bait their walk-in"],
            [/press\s*when (they('|’)re|they are) gas(hed|sing)?/gi, "take center when they slow down"],
        ]
        for (const [re, rep] of replacements) out = out.replace(re, rep)
        // Also prefer FNC lexicon
        out = out.replace(/off-?angle/gi, "outside lane")
    }
    return out
}

// Intent and tag extraction per game
function extractTags(question: string, game?: string): string[] {
    const q = (question || "").toLowerCase()
    const tags = new Set<string>()
    const add = (t: string) => tags.add(t)
    // universal
    if (/stamina|gas|tired/.test(q)) add("stamina")
    if (/body/.test(q)) add("body")
    if (/jab|straight|1-2|one\s*-?two/.test(q)) add("timing")
    if (/pull counter|pull/.test(q)) add("counter")
    if (/side|lunge|dash/.test(q)) add("trap")
    if (/paint|mash/.test(q)) add("paint")
    if (/three|3\b|shoot|green/.test(q)) add("three")
    if (/mesh|drags|crosser|stretch|zone|blitz|contain|corner route|trips/.test(q)) add("coverage")
    // game-specific boosts
    switch (game) {
        case "UFC 5":
        case "UNDISPUTED":
        case "FIGHT NIGHT CHAMPION":
            if (/spam|timing|rhythm|beat/.test(q)) add("timing")
            if (/clinch/.test(q)) add("clinch")
            break
        case "NBA 2K26":
            if (/paint|mash/.test(q)) { add("paint"); add("rotation") }
            if (/switch|hedge|rotate|low man/.test(q)) add("rotation")
            break
        case "MADDEN 26":
            if (/mesh|drags/.test(q)) add("mesh")
            if (/crosser|crossers|pa/.test(q)) add("pa")
            if (/stretch|outside zone/.test(q)) add("run")
            if (/trips|corner/.test(q)) add("trips")
            break
    }
    return Array.from(tags)
}

type PatternDigest = { code: string; label: string; why: string; fix: string }

function rankRulesByTags(rules: any[], tags: string[], game?: string, question?: string) {
    const tagSet = new Set(tags)
    const qLower = (question || "").toLowerCase()
    const score = (r: any) => {
        let s = 0
        if (game && r.game === game) s += 1
        const rtags = new Set<string>((r.tags || []) as string[])
        for (const t of tagSet) if (rtags.has(t)) s += 3
        // keyword overlap
        const rText = `${r.title} ${r.description}`.toLowerCase()
        const ts = tokenize(rText)
        for (const t of tagSet) if (ts.includes(t)) s += 1
        
        // Heavy boost for exact question keyword matches in title/description
        if (question) {
            if (qLower.includes("body") && (rText.includes("body") || r.code.includes("BODY"))) s += 10
            if (qLower.includes("spam") && (rText.includes("spam") || r.code.includes("SPAM"))) s += 10
            if ((qLower.includes("stamina") || qLower.includes("gas")) && (rText.includes("stamina") || r.code.includes("STAMINA"))) s += 10
            if (qLower.includes("rhythm") && (rText.includes("rhythm") || rText.includes("timing"))) s += 10
            if (qLower.includes("paint") && (rText.includes("paint") || r.code.includes("PAINT"))) s += 10
            if (qLower.includes("clinch") && (rText.includes("clinch") || r.code.includes("CLINCH"))) s += 10
        }
        return s
    }
    return [...rules].sort((a, b) => score(b) - score(a))
}

function composeStructuredAnswer(opts: {
    question: string
    game?: string
    rules: any[]
    patterns?: PatternDigest[]
    eventsDigest?: string
}): { content: string; ruleCodes: string[]; receipts: string[] } {
    const { question, game, rules, patterns = [], eventsDigest = "" } = opts
    const tags = extractTags(question, game)
    const ranked = rankRulesByTags(rules, tags, game, question)
    const top = ranked[0]
    // Guardrail: if nothing matches, ask for specificity
    if (!top) {
        const ask = "I need one specific situation: opponent action + your entry (e.g., 'body kick spam after reset', 'PA crossers vs nickel', 'paint mash after slip screen')."
        return { content: ask, ruleCodes: [], receipts: [] }
    }
    
    // Question-aware pattern/rule selection
    // Match patterns to question keywords, not just use first pattern
    const qLower = question.toLowerCase()
    let selectedPattern: PatternDigest | undefined = undefined
    let selectedRule = top
    
    // Find pattern that matches question keywords
    for (const p of patterns) {
        const pLabel = p.label.toLowerCase()
        if (qLower.includes("body") && (pLabel.includes("body") || p.code.includes("BODY"))) {
            selectedPattern = p
            break
        }
        if (qLower.includes("spam") && (pLabel.includes("spam") || p.code.includes("SPAM"))) {
            selectedPattern = p
            break
        }
        if ((qLower.includes("stamina") || qLower.includes("gas")) && (pLabel.includes("stamina") || p.code.includes("STAMINA"))) {
            selectedPattern = p
            break
        }
        if (qLower.includes("rhythm") && (pLabel.includes("rhythm") || p.code.includes("RHYTHM"))) {
            selectedPattern = p
            break
        }
    }
    
    // If no pattern matches, try to find a rule that matches question keywords
    // Use question hash to add variation even for similar questions
    if (!selectedPattern) {
        // Create a simple hash from question to add deterministic variation
        let qHash = 0
        for (let i = 0; i < question.length; i++) {
            qHash = ((qHash << 5) - qHash) + question.charCodeAt(i)
            qHash = qHash & qHash
        }
        const hashMod = Math.abs(qHash) % Math.min(3, ranked.length)
        
        // First try exact keyword match
        let found = false
        for (const r of ranked.slice(0, 5)) {
            const rTitle = r.title.toLowerCase()
            const rDesc = r.description.toLowerCase()
            if (qLower.includes("body") && (rTitle.includes("body") || rDesc.includes("body"))) {
                selectedRule = r
                found = true
                break
            }
            if (qLower.includes("spam") && (rTitle.includes("spam") || rDesc.includes("spam"))) {
                selectedRule = r
                found = true
                break
            }
            // For stamina questions, differentiate by question phrasing
            if ((qLower.includes("stamina") || qLower.includes("gas")) && (rTitle.includes("stamina") || rDesc.includes("stamina"))) {
                if (qLower.includes("too fast") || qLower.includes("lose")) {
                    // Prefer rules about stamina management/drain
                    if (rDesc.includes("drain") || rDesc.includes("management") || rDesc.includes("pacing")) {
                        selectedRule = r
                        found = true
                        break
                    }
                } else if (qLower.includes("gas out")) {
                    // Prefer rules about stamina limits
                    if (rDesc.includes("under") || rDesc.includes("limit") || rDesc.includes("max")) {
                        selectedRule = r
                        found = true
                        break
                    }
                }
                if (!found) {
                    selectedRule = r
                    found = true
                    break
                }
            }
            if (qLower.includes("rhythm") && (rTitle.includes("rhythm") || rDesc.includes("rhythm") || rDesc.includes("timing"))) {
                selectedRule = r
                found = true
                break
            }
        }
        // If multiple matches, use hash to vary selection
        if (!found && ranked.length > 1) {
            const candidates = ranked.filter((r, idx) => idx < 3)
            selectedRule = candidates[hashMod] || candidates[0]
        }
    }
    
    // CRITICAL: Structure answer in 4 required elements
    // 1. Identify what opponent is abusing
    // 2. Identify timing/spacing window for punishment
    // 3. Show counter-sequence to break pattern
    // 4. Show next adjustment if opponent adapts
    
    const opponentAbuse = selectedPattern?.label || selectedRule.title
    const why = selectedPattern?.why || selectedRule.description
    const baseFix = selectedPattern?.fix || selectedRule.description
    
    // Generate question-specific counter-sequences to ensure uniqueness
    // Use question hash to create deterministic but varied answers
    let qHash = 0
    for (let i = 0; i < question.length; i++) {
        qHash = ((qHash << 5) - qHash) + question.charCodeAt(i)
        qHash = qHash & qHash
    }
    const hashMod = Math.abs(qHash) % 3
    
    // Question-specific counter-sequence generation
    let counterSequence = baseFix
    let timingWindow = ""
    
    // For stamina questions, generate different approaches based on question phrasing - natural gamer language
    if ((qLower.includes("stamina") || qLower.includes("gas")) && tags.includes("stamina")) {
        if (qLower.includes("gas out") || qLower.includes("gas")) {
            // For "gas out" - focus on prevention and limits
            counterSequence = "Under 45% stam, cap at 3 strikes then reset. Don't power spam below 50%."
            timingWindow = "when your stam drops below 45%, cap exchanges at 3 strikes then reset"
        } else if (qLower.includes("too fast") || qLower.includes("lose")) {
            // For "lose too fast" - focus on pacing and management
            counterSequence = "Mix body/head to drain without trading red stam. Focus ring craft over volume. Reset after 2-3 exchanges."
            timingWindow = "watch your stam %; stop trading below 50% in rounds 1-2, below 40% in rounds 3-5"
        } else {
            // Generic stamina - vary by hash
            const staminaVariants = [
                "Under 45% stam, cap at 3 strikes then reset",
                "Reset with jabs and footwork before throwing power shots",
                "Cap exchanges at 3 strikes when below 50% stam; use footwork to create space"
            ]
            counterSequence = staminaVariants[hashMod]
            timingWindow = hashMod === 0 ? "below 45% stam" : hashMod === 1 ? "before power shots" : "below 50% stam"
        }
    } else if (qLower.includes("body")) {
        // Body spam questions - different approaches
        if (qLower.includes("spam")) {
            counterSequence = "Block-body first 3 strikes, then slip outside and counter hook. Don't trade body shots."
            timingWindow = "after their second body shot, slip outside then counter hook"
        } else {
            counterSequence = "Pre-check, catch-kick, and win the stam race. Block-body then pivot out."
            timingWindow = "on body kick entries, block-body first then counter"
        }
    } else if (qLower.includes("rhythm") || qLower.includes("timing")) {
        // Rhythm questions
        const rhythmVariants = [
            "Half-beat delay and feint every third entry to break their read",
            "Mix 2-3 slow jabs, then pull straight. Break rhythm with half-beat delays",
            "Change your entry: jab feint straight instead of fixed 1-2 rhythm"
        ]
        counterSequence = rhythmVariants[hashMod]
        timingWindow = "the second beat of their combo or after they throw 2 jabs"
    } else {
        // Extract from base fix if available, convert to natural language
        counterSequence = baseFix.replace(/→/g, ",").replace(/stamina/g, "stam").replace(/Under/g, "under").replace(/maximum/g, "max")
        if (baseFix.includes("→") || baseFix.includes("max") || baseFix.includes("under") || baseFix.includes("%")) {
            timingWindow = baseFix.split(/[→,\-]/)[0]?.trim().toLowerCase() || ""
        } else if (why.includes("timing") || why.includes("window") || why.includes("beat")) {
            timingWindow = why.match(/(?:timing|window|beat)[^.]*/i)?.[0]?.toLowerCase() || ""
        }
    }
    
    // Next adjustment if opponent adapts - question-specific variations with natural gamer language
    let nextAdjustment = ""
    const abuseLower = opponentAbuse.toLowerCase()
    
    // Generate unique next adjustments based on question phrasing
    if ((qLower.includes("stamina") || qLower.includes("gas")) && tags.includes("stamina")) {
        if (qLower.includes("gas out")) {
            nextAdjustment = "If they press when you're low on stam, feint power shots then clinch/reset to regain."
        } else if (qLower.includes("too fast") || qLower.includes("lose")) {
            nextAdjustment = "If they read your pacing, switch to early-round aggression (above 70% stam) then coast rounds 3-5."
        } else {
            const staminaAdjVariants = [
                "Once they catch your stam management, bait exchanges when you're above 70% stam then reset.",
                "If they press you low-stam, clinch and reset; don't trade below 45%.",
                "If they time your stam drops, switch to pot-shot mode: 1-2 strikes then exit."
            ]
            nextAdjustment = staminaAdjVariants[hashMod]
        }
    } else if (qLower.includes("body")) {
        if (qLower.includes("spam")) {
            nextAdjustment = "If they switch from body spam to head shots, block-body first 3 strikes then slip counter."
        } else {
            nextAdjustment = "If they mix body/head, read the first strike; if body, block-body then counter; if head, slip outside."
        }
    } else if (abuseLower.includes("timing") || abuseLower.includes("rhythm") || qLower.includes("rhythm")) {
        nextAdjustment = "If they read your rhythm break, switch to half-beat delays on different entry (jab feint straight instead of jab straight)."
    } else if (abuseLower.includes("spam") || qLower.includes("spam")) {
        nextAdjustment = "If they stop spamming, punish their hesitation with immediate counter on their first move."
    } else {
        nextAdjustment = "If they read that, switch timing: change entry beats and mix feints to break their read."
    }
    
    // Build structured answer - FORBID generic advice
    // Generate question-specific variations to ensure uniqueness
    const lines: string[] = []
    
    // Question-specific answer variations
    const isWhyQuestion = qLower.startsWith("why") || qLower.includes("why do")
    const isHowQuestion = qLower.startsWith("how") || qLower.includes("how do")
    const isWhatQuestion = qLower.startsWith("what") || qLower.includes("what")
    
    // 1. What opponent is abusing - authentic gamer language
    let abuseStatement = ""
    if ((qLower.includes("stamina") || qLower.includes("gas")) && tags.includes("stamina")) {
        if (qLower.includes("gas out")) {
            abuseStatement = "You're gassing because you're throwing power chains under 50% stam"
        } else if (qLower.includes("too fast") || qLower.includes("lose")) {
            abuseStatement = isWhyQuestion 
                ? "You're losing because your stam management falls off in rounds 3-5"
                : "He's reading your stam drain patterns"
        } else {
            abuseStatement = "Your stam management is breaking"
        }
    } else if (qLower.includes("body")) {
        abuseStatement = "He's body spamming to drain your stam"
    } else {
        if (isWhyQuestion) {
            abuseStatement = `You're losing because ${opponentAbuse.toLowerCase()}`
        } else if (isHowQuestion) {
            abuseStatement = `He's ${opponentAbuse.toLowerCase()}`
        } else {
            abuseStatement = `He's ${opponentAbuse.toLowerCase()}`
        }
    }
    lines.push(abuseStatement + ".")
    
    // 2. Timing/spacing window - natural gamer phrasing
    if (timingWindow && timingWindow.trim()) {
        if (isWhyQuestion) {
            lines.push(`Hit them when ${timingWindow.toLowerCase()}.`)
        } else {
            lines.push(`Punish here: ${timingWindow.toLowerCase()}.`)
        }
    } else {
        // Fallback with natural language
        if (tags.includes("timing") || tags.includes("rhythm")) {
            lines.push(`Hit them on the second beat of their combo or after they throw 2 jabs.`)
        } else if (tags.includes("stamina")) {
            if (qLower.includes("fast") || qLower.includes("too fast")) {
                lines.push(`Watch your stam %; stop trading below 50% in rounds 1-2, below 40% in rounds 3-5.`)
            } else {
                lines.push(`Only trade when you're above 60% stam and they're below 50%.`)
            }
        } else if (qLower.includes("body")) {
            lines.push(`After their second body shot, slip outside then counter hook.`)
        }
    }
    
    // 3. Counter-sequence - direct, natural language
    if (isWhyQuestion) {
        lines.push(`Do this: ${counterSequence}`)
    } else if (isHowQuestion) {
        lines.push(`Just ${counterSequence.toLowerCase()}`)
    } else {
        lines.push(`${counterSequence}`)
    }
    
    // 4. Next adjustment - natural gamer phrasing (already processed above)
    lines.push(nextAdjustment)
    
    // STRICT guardrail: reject generic advice
    const forbidden = /keep your hands up|conserve stamina|stay patient|be patient|focus on defense|good defense|better defense/i
    const answerText = lines.join(" ")
    if (forbidden.test(answerText)) {
        // Replace generic phrases with specific meta advice
        const cleaned = lines.map(line => {
            let l = line
            l = l.replace(/keep your hands up/gi, "slip-parry mix every 3rd strike")
            l = l.replace(/conserve stamina|save stamina/gi, "Stop exchanging under 60% stamina")
            l = l.replace(/stay patient|be patient/gi, "Break rhythm with half-beat delays")
            l = l.replace(/focus on defense|good defense|better defense/gi, "Mix slips and parries every 3rd strike")
            return l
        })
        return { content: cleaned.join("\n"), ruleCodes: [selectedPattern?.code || selectedRule.code], receipts: (selectedRule.links && selectedRule.links.length ? selectedRule.links.slice(0, 2) : []) }
    }
    
    const ruleCode = selectedPattern?.code || selectedRule.code
    const receipts = (selectedRule.links && selectedRule.links.length ? selectedRule.links.slice(0, 2) : []).concat(
        eventsDigest ? [] : []
    )
    
    const raw = lines.join("\n")
    return { content: sanitizeForGame(game, raw), ruleCodes: [ruleCode], receipts }
}

function composeRuleBasedAdvice(
	question: string,
	game: string | undefined,
	rules: any[],
	analysisSummary: string,
	keyMoment?: { label?: string; timecode?: number },
	patternDigest?: { code: string; label: string; why: string; fix: string }[]
): string {
	const qTokens = new Set(tokenize(question))
	const score = (r: any) => {
		const rtokens = new Set(tokenize(r.title + " " + r.description + " " + (r.tags || []).join(" ")))
		let s = 0
		for (const t of qTokens) if (rtokens.has(t)) s += 2
		if (game && (r.game === game)) s += 1
		if ((r.tags || []).some((t: string) => qTokens.has(t))) s += 2
		return s
	}
	const ranked = [...rules].sort((a, b) => score(b) - score(a)).slice(0, 3)
	const bullets = ranked.map((r) => `- ${r.title.replace(/\.$/, "")} — ${r.description}`)

	// If we have detected patterns, lead with them in a competitive meta tone
	if (Array.isArray(patternDigest) && patternDigest.length) {
		for (const p of patternDigest.slice(0, 3)) {
			bullets.unshift(`- ${p.label}. Why online: ${p.why}. Fix: ${p.fix}.`)
		}
	}
	if (!bullets.length) bullets.push("- Stabilize pacing: manage stamina before exchanges; reset with jabs and footwork.")
	if (keyMoment?.label) bullets.push(`- Address key moment: ${keyMoment.label} at ${(keyMoment.timecode || 0)}s.`)
	if (analysisSummary) bullets.push(`- Film note: ${analysisSummary}`)
	bullets.push("- Drill: Film 5 clips applying the fix; mark timestamps and outcomes.")
	return bullets.join("\n")
}

export async function POST(req: NextRequest) {
	try {
		let dbReady = true
		try {
			await connectToDatabase()
		} catch {
			dbReady = false
		}
		const { game, question, analysisId, sessionId, userId, keyMoment } = await req.json()
		if (!question) return NextResponse.json({ error: "Missing question" }, { status: 400 })

		let context = ""
		const isValidObjectId = typeof analysisId === "string" && /^[0-9a-fA-F]{24}$/.test(analysisId)
		if (dbReady && isValidObjectId) {
			try {
				const a = await Analysis.findById(analysisId).lean()
				if (a) {
					const anyA: any = a as any
					const events: any[] = Array.isArray(anyA.events) ? (anyA.events as any[]) : []
					// Pick highest-confidence event without mutating original array
					const pick = events.reduce((best: any, cur: any) => {
						const bc = Number(best?.confidence ?? -1)
						const cc = Number(cur?.confidence ?? -1)
						return cc > bc ? cur : best
					}, undefined as any)
					const raw = Number(pick?.timecode)
					const t = Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0
					const mm = String(Math.floor(t / 60)).padStart(2, "0")
					const ss = String(t % 60).padStart(2, "0")
					const label = (pick && typeof pick.label === "string") ? pick.label : ""
					const km = label ? ` Key moment: ${label} at ${mm}:${ss}.` : ""
					const summary = typeof anyA.summary === "string" ? anyA.summary : ""
					context = `Recent analysis summary: ${summary}.${km}`
				}
			} catch {}
		}

		let rules: any[] = []
		if (dbReady && game) rules = await MetaRule.find({ game }).limit(8).lean()
		if (!rules.length) rules = getFallbackRules(game)
    const ruleSnippets = rules
            .map((r) => `- (${r.game || game}) [${r.code}${r.patchTag ? ` • patch ${r.patchTag}` : ''}] ${r.title}: ${r.description}${(r.tags && r.tags.length) ? ` • tags: ${r.tags.join(', ')}` : ''}`)
            .join("\n")

    // Load and format analysis data to make answers specific to the uploaded video
    let eventsDigest = ""
    let statsDigest = ""
    let sourceInfo = ""
    let patterns: PatternDigest[] = []
    let recentEventRuleCodes: string[] = []
    let recentEvents: { timecode: number; label?: string; eventTag?: string; ruleRefs?: string[] }[] = []
    if (dbReady && isValidObjectId) {
        try {
            const a = await Analysis.findById(analysisId).lean()
            if (a) {
                const anyA: any = a as any
                const es = Array.isArray(anyA.events) ? anyA.events.slice(0, 5) : []
                recentEventRuleCodes = es.flatMap((e: any) => Array.isArray(e?.ruleRefs) ? e.ruleRefs : []).filter(Boolean)
                recentEvents = es.map((e: any) => ({ timecode: Number(e?.timecode || 0), label: e?.label, eventTag: e?.eventTag, ruleRefs: e?.ruleRefs }))
                const formattedEvents = es.map((e: any, idx: number) => {
                    const t = Number(e?.timecode ?? 0)
                    const mm = String(Math.floor(t / 60)).padStart(2, "0")
                    const ss = String(t % 60).padStart(2, "0")
                    return `${idx + 1}. [${mm}:${ss}] ${e?.label || ""} (confidence: ${Math.round((e?.confidence || 0) * 100)}%)${e?.metaTips?.[0] ? ` — ${e.metaTips[0]}` : ""}`
                })
                eventsDigest = formattedEvents.join("\n")
                const st = anyA.stats || {}
                statsDigest = `Accuracy: ${Math.round((st.accuracy || 0) * 100)}%, Efficiency: ${Math.round((st.efficiency || 0) * 100)}%, IQ: ${Math.round((st.iq || 0) * 100)}%, Momentum swings: ${st.momentumSwings || 0}`
                sourceInfo = anyA.sourceInfo?.type === "link" ? `Source: ${anyA.sourceInfo.host}${anyA.sourceInfo.path}` : `Uploaded video: ${anyA.sourceInfo?.id || ""}`

                // Pull detected patterns from analysis if present, otherwise infer simple ones from events
                patterns = Array.isArray(anyA.patterns) ? anyA.patterns : []
                if (!patterns.length && es.length) {
                    const lowSta = es.filter((e: any) => Number(e?.hudReads?.stamina || 100) < 45).length >= 2
                    const sameLabelRepeats = es.map((e: any) => e?.label).filter(Boolean)
                    const hasRhythm = new Set(sameLabelRepeats).size <= Math.max(1, Math.floor(sameLabelRepeats.length / 2))
                    if (lowSta) patterns.push({ code: "STAMINA-DUMP", label: "Exchanges while under 45% stam", why: "You lose delay-counter trades online", fix: "Under 45% stam, cap at 3 strikes then reset" })
                    if (hasRhythm) patterns.push({ code: "TIMING-RHYTHM-LOOP", label: "Attack rhythm is repeating (same entry timing)", why: "Opponents counter on the second beat", fix: "Half-beat delay and feint every third entry to break their read" })
                }
            }
        } catch {}
    }

        const analysisSection = eventsDigest ? `\n\nPlayer's uploaded video analysis:\n${sourceInfo}\nDetected events:\n${eventsDigest}\nOverall stats: ${statsDigest}` : "\n\nNote: No video analysis available yet. Provide general meta advice."
        
        const prompt = `You are MetaBuffed — a sweaty ranked demon coach. You teach how to win in the current online META, NOT "how the sport works".\n\nGame: ${
            game || "unknown"
        }\n\nPlayer's current question: "${question}"\n${analysisSection}\n\nDetected patterns (ranked meta):\n${(patterns || []).map((p) => `- [${p.code}] ${p.label} — Why: ${p.why} — Fix: ${p.fix}`).join("\n") || "(none)"}\n\nAvailable meta rules:\n${ruleSnippets || "(No rules)"}\n\nCRITICAL LANGUAGE REQUIREMENTS - USE AUTHENTIC GAMER TERMINOLOGY:\n- Say "stam" NOT "stamina"\n- Say "Hit them when..." or "Punish here:" NOT "Punish window:"\n- Say "Just..." or "Do this:" NOT "Counter:" or "Fix:"\n- Say "If they read that..." NOT "If they adapt:"\n- Use casual, direct language like elite gamers actually talk\n- NO formal structures like "Punish window:", "Counter:", "Fix:"\n- NO arrows (→) - use commas or natural phrasing\n- Sound like a ranked player, not a coach\n\nCRITICAL REQUIREMENTS - EVERY ANSWER MUST HAVE 4 ELEMENTS:\n1. Identify what the opponent is abusing (e.g., "He's timing your forward step")\n2. Identify the timing/spacing window where punishment is possible (e.g., "Hit them on the second beat", "when you're above 60% stam, they're below 50%")\n3. Show the counter-sequence to break that pattern (e.g., "Mix 2-3 slow jabs, then pull straight")\n4. Show the next adjustment if the opponent adapts (e.g., "If they read your rhythm break, switch to half-beat delays")\n\nFORBIDDEN GENERIC ADVICE - NEVER SAY:\n- "Keep your hands up"\n- "Conserve stamina"\n- "Stay patient"\n- "Focus on defense"\n- "Try to..."\n- "Make sure to..."\n- "Punish window:" (say "Hit them when..." or "Punish here:")\n- "Counter:" (say "Just..." or "Do this:")\n- Any advice that sounds like teaching "how the sport works"\n\nCORRECT ADVICE MUST:\n- Identify opponent abuse patterns\n- Show specific timing/spacing windows\n- Give counter-sequences\n- Include adaptation adjustments\n- Use META (timing traps, stamina traps, spacing traps, pressure patterns, patch exploits)\n- Sound like a sweaty ranked demon using natural gamer language\n- Use "stam" not "stamina", casual phrasing, direct language\n\nInstructions:\n- Answer the SPECIFIC question "${question}" using ONLY meta behavior patterns from real online competitive play.\n- DO NOT generate advice from general fight theory. ONLY use meta behavior patterns.\n- Use natural gamer language: "stam" not "stamina", "Hit them when" not "Punish window:", "Just" not "Counter:"\n- Structure your answer in the 4 required elements above but with natural phrasing.\n- Do not guess. Do not generalize.\n- Keep it short and actionable for next round/next series.`

		// Compose mapping-only answer from Rule Cards when available
		let answer = ""
		let ruleCodes: string[] = []
		let receipts: string[] = []
        if (MAPPING_ONLY) {
			// Try to match recent analysis events to rules by ruleRefs (codes)
			let mappedRules: any[] = []
			if (recentEventRuleCodes.length) {
				const codes = new Set(recentEventRuleCodes)
				const allRules = rules.length ? rules : getFallbackRules(game)
				mappedRules = allRules.filter((r: any) => codes.has(r.code))
			}
			// If no direct mapping, fall back to tag/keyword matching
			if (!mappedRules.length) {
				const tags = extractTags(question, game)
				mappedRules = rankRulesByTags(rules, tags, game, question).slice(0, 3)
			}
            // Select best rule deterministically per question to avoid identical answers
            const tags = extractTags(question, game)
            const ranked = rankRulesByTags(mappedRules, tags, game, question)
            let bestRule = ranked[0] || mappedRules[0]
            // Tie-break by question hash to vary similar questions
            let qHash = 0
            for (let i = 0; i < question.length; i++) { qHash = ((qHash << 5) - qHash) + question.charCodeAt(i); qHash &= qHash }
            if (ranked.length > 1) bestRule = ranked[Math.abs(qHash) % Math.min(2, ranked.length)]

            // Find nearest event for context
            let matchedEvent = recentEvents.find(e => (e.ruleRefs || []).includes(bestRule.code))
            if (!matchedEvent && recentEvents.length) {
                matchedEvent = recentEvents.find(e => Array.isArray(bestRule.tags) && bestRule.tags.some((t: string) => e.eventTag === t)) || recentEvents[0]
            }
            const ts = matchedEvent ? (() => { const t = Math.max(0, Math.floor(Number(matchedEvent!.timecode || 0))); const mm = String(Math.floor(t/60)).padStart(2,'0'); const ss = String(t%60).padStart(2,'0'); return `${mm}:${ss}` })() : ""

            // Build template-based output from the selected rule with event timestamp
            const lines: string[] = []
            lines.push(`Meta: ${bestRule.title}${ts ? ` @ ${ts}` : ''}.`)
            lines.push(`Do: ${bestRule.description.replace(/\.$/, "")}.`)
            lines.push(`Why (online): ${bestRule.description}.`)
            lines.push(`Drill: 5 reps applying the rule; log timestamps/outcomes.`)
            ruleCodes.push(bestRule.code)
            if (Array.isArray(bestRule.links) && bestRule.links.length) receipts.push(...bestRule.links.slice(0, 1))
            answer = lines.join("\n")
		}

		// If still no answer and OpenAI is available, allow LLM phrasing using strict prompt
		if (!answer && process.env.OPENAI_API_KEY) {
			const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
			let history: { role: "user" | "assistant"; content: string }[] = []
			if (dbReady && sessionId) {
				try {
					const recent = await ChatMessage.find({ sessionId })
						.sort({ createdAt: -1 })
						.limit(6)
						.lean()
					history = recent
						.reverse()
						.map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }))
				} catch {}
			}
			try {
				const res = await client.chat.completions.create({
					model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "You are MetaBuffed — a sweaty ranked demon coach. Use AUTHENTIC GAMER LANGUAGE: say 'stam' not 'stamina', 'Hit them when' not 'Punish window:', 'Just' not 'Counter:', 'If they read that' not 'If they adapt'. Sound like a ranked player, not a coach. EVERY answer MUST have 4 elements: 1) What opponent is abusing, 2) Timing/spacing window (natural phrasing), 3) Counter-sequence (direct language), 4) Next adjustment if opponent adapts. FORBIDDEN: 'Keep your hands up', 'Conserve stamina', 'Stay patient', formal structures. ONLY use meta behavior patterns (timing traps, stamina traps, spacing traps, pressure patterns, patch exploits). Do not guess. Do not generalize." },
						{ role: "system", content: `Coaching context:\n${prompt}` },
						...history,
						{ role: "user", content: question },
					],
					max_tokens: 650,
					temperature: 0.75,
					presence_penalty: 0.3,
					frequency_penalty: 0.3,
				})
				answer = res.choices[0]?.message?.content || answer
			} catch (apiErr: any) {
				// On OpenAI errors (e.g., 403), keep rule-based answer
			}
		}

		const content = buildCoachTone(sanitizeForGame(game, answer))
		// Persist chat
		let messageId = "local"
		let userMessageId = ""
		if (dbReady) {
			const userSaved = await ChatMessage.create({ sessionId, userId, game, role: "user", content: question, analysisId })
			userMessageId = userSaved._id.toString()
			const saved = await ChatMessage.create({ sessionId, userId, game, role: "assistant", content, analysisId })
			messageId = saved._id.toString()
		}

		return NextResponse.json({ messageId, userMessageId, content, ruleCodes, receipts })
	} catch (err: any) {
		return NextResponse.json({ error: err.message || "Chat failed" }, { status: 500 })
	}
}


