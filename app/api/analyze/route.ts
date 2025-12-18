import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { Analysis } from "@/models/Analysis"
import { MetaRule } from "@/models/MetaRule"
import { getFallbackRules } from "@/lib/fallback"
import { getEventTagsForGame } from "@/lib/eventTags"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
	try {
		let dbReady = true
		try {
			await connectToDatabase()
		} catch {
			dbReady = false
		}

		const contentType = req.headers.get("content-type") || ""
		let game = ""
		let inputType: "upload" | "link" = "link"
		let inputRef = ""
		let sessionId = ""

		if (contentType.includes("application/json")) {
			const body = await req.json()
			game = (body.game || "").trim()
			sessionId = (body.sessionId || "").trim()
			if (body.link) {
				inputType = "link"
				inputRef = String(body.link)
			}
			if (body.uploadId) {
				inputType = "upload"
				inputRef = String(body.uploadId)
			}
		} else {
			const form = await req.formData()
			game = String(form.get("game") || "")
			sessionId = String(form.get("sessionId") || "")
			if (form.get("link")) {
				inputType = "link"
				inputRef = String(form.get("link"))
			} else if (form.get("uploadId")) {
				inputType = "upload"
				inputRef = String(form.get("uploadId"))
			}
		}

		if (!game || !inputRef) {
			return NextResponse.json({ error: "Missing game or input reference" }, { status: 400 })
		}

		let doc: any = { game, inputType, inputRef, status: "processing", userId: sessionId || undefined }
		if (dbReady) {
			doc = await Analysis.create(doc)
		}

		// Simulate detection and rule mapping with deterministic variety per inputRef
		let rules: any[] = []
		if (dbReady) {
			rules = await MetaRule.find({ game }).limit(10).lean()
		}
		if (!rules.length) rules = getFallbackRules(game)

		// simple seeded RNG based on inputRef so each video/link yields different timestamps and labels
		function hashString(s: string): number {
			let h = 2166136261 >>> 0
			for (let i = 0; i < s.length; i++) {
				h ^= s.charCodeAt(i)
				h = Math.imul(h, 16777619)
			}
			return h >>> 0
		}
		let seed = hashString(inputRef + ':' + game)
		const rnd = () => {
			// xorshift32
			seed ^= seed << 13; seed >>>= 0
			seed ^= seed >> 17; seed >>>= 0
			seed ^= seed << 5; seed >>>= 0
			return (seed >>> 0) / 4294967296
		}

		const eventTags = getEventTagsForGame(game)
		const numEvents = 3 + Math.floor(rnd() * 3) // 3-5 events
		
		// Lightweight meta-pattern generators per game (synthetic but specific)
		function makePatternFindings(g: string) {
			const findings: { code: string; label: string; why: string; fix: string }[] = []
			const lowSta = rnd() < 0.6
			const fixedRhythm = rnd() < 0.55
			const pullCounter = rnd() < 0.45
			const sideDashHook = rnd() < 0.4
			if (g === "UFC 5" || g === "FIGHT NIGHT CHAMPION" || g === "UNDISPUTED") {
				if (fixedRhythm)
					findings.push({
						code: "TIMING-RHYTHM-LOOP",
						label: "Exchange rhythm is predictable (1–2, pause, reset)",
						why: "Opponents began countering on your second strike from Round 2",
						fix: "Insert half-beat delays + feints every third entry to break reads",
					})
				if (lowSta)
					findings.push({
						code: "STAMINA-DUMP",
						label: "Power chains thrown under 45% stamina",
						why: "Online windows punish low-stamina strings with delayed counters",
						fix: "Under 45% stamina → max 3 strikes per exchange → reset footwork",
					})
				if (pullCounter)
					findings.push({
						code: "PULL-COUNTER-WINDOWS",
						label: "Forward step on reset exposes pull-counter timing",
						why: "Your resets step into opponent's pull window",
						fix: "Reset back-left or neutral; re-enter on third beat",
					})
				if (sideDashHook && g !== "UNDISPUTED")
					findings.push({
						code: "SIDE-DASH-HOOK-TRAP",
						label: "Side dash + hook trap detected",
						why: "You chase on same lane; get clipped exiting block",
						fix: "Mirror step guard, then jab check and pivot out",
					})
			}
			if (g === "NBA 2K26") {
				if (rnd() < 0.5)
					findings.push({
						code: "2K-PAINT-MASH",
						label: "Paint mash rhythm detected after broken play",
						why: "Opponent mashes in mismatch windows; you help late",
						fix: "Pre-rotate low man; shade baseline; hands-up contest timing",
					})
			}
			if (g === "MADDEN 26") {
				if (rnd() < 0.55)
					findings.push({
						code: "MADDEN-PA-CROSSERS",
						label: "PA crossers spam with motion",
						why: "You leave middle third vacated on rollouts",
						fix: "Put FS in middle third, QB contain, force checkdown",
					})
				if (rnd() < 0.55)
					findings.push({
						code: "MADDEN-MESH-DRAGS",
						label: "Mesh/drags farming YAC",
						why: "User MLB not occupying shallow hook",
						fix: "User MLB sit 3–7 yds; shade inside; rally tackle",
					})
			}
			return findings
		}
		const patternFindings = makePatternFindings(game)
		// Game-specific event templates
		type EventTemplate = { whatHappened: string; whyOnline: string; whatToDo: string; drill: string }
		const eventTemplates: Record<string, Record<string, EventTemplate[]>> = {
			"UFC 5": {
				stamina_drop: [
					{
						whatHappened: "Threw 5 power punches while stamina was below 45%",
						whyOnline: "Low-stamina power chains get blown up by delayed counters; stamina race decides late rounds",
						whatToDo: "Under 45% stamina → max 3 strikes per exchange → reset footwork, jab reset",
						drill: "Film 5 clips under 45% stamina: cap at 3 strikes, log outcomes",
					},
				],
				missed_counter: [
					{
						whatHappened: "Missed counter window on opponent's lead hook",
						whyOnline: "Pre-emptive counters punish fixed entry timing online",
						whatToDo: "Delay counter to third beat or jab feint then pull-counter",
						drill: "Record 10 delay-counters: half-beat delay on hook entries",
					},
				],
				side_dash_hook: [
					{
						whatHappened: "Got clipped after side dash + hook trap",
						whyOnline: "Chasing on same lane gets punished by angle hooks in netplay",
						whatToDo: "Mirror step guard, jab check, pivot exit before re-entry",
						drill: "Shadow drill: mirror step → jab check → pivot; 10 reps",
					},
				],
				pull_counter_window: [
					{
						whatHappened: "Forward step on reset opened pull-counter window",
						whyOnline: "Stepping in on reset gives opponent free pull timing",
						whatToDo: "Reset back-left or neutral, re-enter on third beat",
						drill: "Record 10 resets: exit back-left only; re-enter on count 3",
					},
				],
			},
			"UNDISPUTED": {
				movement_meta: [
					{
						whatHappened: "Circle-step + pivot offense pulled you into traps",
						whyOnline: "Movement meta wins rounds via safe points and angle traps",
						whatToDo: "Feint feet first, jab-tag exit lanes, never chase same lane twice",
						drill: "Footwork drill: feint → tag → exit; 15 sequences",
					},
				],
				body_tax: [
					{
						whatHappened: "Body hook spam at round start drained stamina",
						whyOnline: "Body-shot tax forces you to lose late rounds",
						whatToDo: "Open with block-body bias, jab-check, then step out; regain center",
						drill: "Record 5 round starts: block-body first 5s, then jab-out",
					},
				],
				straight_spam: [
					{
						whatHappened: "Straight spam timing war",
						whyOnline: "Fixed-beat straights farm points unless you break rhythm",
						whatToDo: "Half-beat delays on your straight, add feints every third entry",
						drill: "Spar drill: 2 minutes of delayed straights on metronome",
					},
				],
			},
			"FIGHT NIGHT CHAMPION": {
				sidestep_uppercut: [
					{
						whatHappened: "Sidestep → uppercut loop clipped your front step",
						whyOnline: "Loop abuse beats straight-in walk downs using punch priority and lane shift",
						whatToDo: "Walk on the outside lane, show lean to bait the sidestep, then straight at safe range and pivot out",
						drill: "Bait sidestep 10x: outside lane → show lean → straight at safe range → pivot",
					},
				],
				lean_bait: [
					{
						whatHappened: "Repeated lean baits drew your counters",
						whyOnline: "Lean rhythm farms counter attempts",
						whatToDo: "Tap jab at the lean hand, slide to the outside lane, delay counter half a beat",
						drill: "Record 10 lean reads, only counter on delayed beat",
					},
				],
				straight_trade: [
					{
						whatHappened: "Straight trade loop gave them advantage",
						whyOnline: "Advantage trading exploits fixed timing",
						whatToDo: "Break rhythm: jab feint, slide outside the center, hook return off their straight",
						drill: "Mirror drill: feint → slip → hook; 12 reps",
					},
				],
			},
			"NBA 2K26": {
				paint_mash: [
					{
						whatHappened: "Paint mash rhythm after broken plays",
						whyOnline: "Mashers exploit late low-man rotations",
						whatToDo: "Pre-rotate low man, shade baseline, contest timing not jumps",
						drill: "Scrim drill: 10 possessions pre-rotate, track FG% in paint",
					},
				],
				three_hunt: [
					{
						whatHappened: "3-hunt with misdirection forced late contests",
						whyOnline: "Shot creators exploit stamina and timing windows",
						whatToDo: "Top-lock hand, trail from hip, switch late with low-man ready",
						drill: "3-hunt drill: top-lock and late switch for 10 reps",
					},
				],
			},
			"MADDEN 26": {
				pa_crossers: [
					{
						whatHappened: "PA crossers with motion every 3rd down",
						whyOnline: "One-shot deep over farms late rotations",
						whatToDo: "FS middle third + QB contain; force checkdown",
						drill: "Lab: 10 reps vs PA crossers; log sacks/throws away",
					},
				],
				mesh_drags: [
					{
						whatHappened: "Mesh/drags YAC farming",
						whyOnline: "Shallow hooks uncovered; user not in window",
						whatToDo: "User MLB sit 3–7 yds, shade inside; rally tackle",
						drill: "Lab: user MLB vs mesh 10 plays; count broken tackles",
					},
				],
				stretch_spam: [
					{
						whatHappened: "HB stretch/outside zone spam",
						whyOnline: "Edge leverage abused; force/contain missing",
						whatToDo: "Shift front strong, set contain, user shoot B-gap",
						drill: "Lab 10 runs: track TFLs after contain + user B-gap",
					},
				],
			},
		}

		const events = Array.from({ length: numEvents }).map((_, idx) => {
			const t = Math.floor(30 + rnd() * 210) // between 00:30 and 04:00
			const tag = eventTags[idx % eventTags.length]
			const matchedRule = rules.find((r: any) => (r.tags || []).includes(tag)) || rules[idx % rules.length]
			
			// Generate structured event data
			const hudStamina = Math.max(0.2, 0.3 + rnd() * 0.5)
			const hudHealth = Math.max(0.4, 0.5 + rnd() * 0.4)
			
			const template = eventTemplates[game]?.[tag]?.[0] || {
				whatHappened: `${matchedRule.title} detected at ${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`,
				whyOnline: matchedRule.description + " This matters in ranked because opponents exploit these patterns.",
				whatToDo: "Apply the meta rule: " + (matchedRule.description.split(";")[0] || matchedRule.description),
				drill: `Film drill: Record 5 clips focusing on this issue; log timestamps and outcomes`,
			}
			
			return {
				timecode: t,
				label: matchedRule.title,
				eventTag: tag,
				confidence: 0.65 + rnd() * 0.3,
				metrics: { stamina: hudStamina, efficiency: 0.45 + rnd() * 0.35 },
				hudReads: {
					stamina: Math.round(hudStamina * 100),
					health: Math.round(hudHealth * 100),
					timer: t,
				},
				whatHappened: template.whatHappened,
				whyOnline: template.whyOnline,
				whatToDo: template.whatToDo,
				drill: template.drill,
				receipts: (matchedRule.links && matchedRule.links.length) ? matchedRule.links.slice(0, 2) : [
					`https://www.youtube.com/results?search_query=${encodeURIComponent(game + ' ranked ' + (matchedRule.title || 'meta'))}`
				],
				metaTips: [matchedRule.description],
				ruleRefs: [matchedRule.code],
				feedback: { helped: 0, notHelped: 0 },
			}
		})

		const sourceInfo = (() => {
			if (inputType === "link") {
				try {
					const u = new URL(inputRef)
					return { type: "link", host: u.host, path: u.pathname }
				} catch {
					return { type: "link", host: "unknown", path: "" }
				}
			}
			return { type: "upload", id: inputRef }
		})()

		const filled = {
			...doc,
			events: events as any,
			status: "completed",
			stats: { accuracy: 0.68, efficiency: 0.61, iq: 0.64, momentumSwings: 2 },
			summary:
				patternFindings.length
					? patternFindings.map((p) => `${p.label} — ${p.fix}`).join(" · ")
					: "Tempo collapses in transition; opponents exploiting jab timing. Prioritize stamina pacing and controlled entries.",
			sourceInfo,
			patterns: patternFindings,
		}
		if (dbReady && doc.save) {
			Object.assign(doc, filled)
			await doc.save()
			return NextResponse.json({ analysisId: doc._id.toString(), report: doc, keyMoment: (events as any)[0] })
		}
		return NextResponse.json({ analysisId: "local", report: filled, keyMoment: (events as any)[0] })
	} catch (err: any) {
		return NextResponse.json({ error: err.message || "Failed to run analysis" }, { status: 500 })
	}
}


