export const FALLBACK_RULES: Record<string, { code: string; title: string; description: string; patchTag?: string; tags?: string[]; links?: string[] }[]> = {
	"UFC 5": [
		{
			code: "UFC5-STAMINA-001",
			title: "Don’t power spam under 50% stamina",
			description: "Low-stamina power chains get blown up by delayed counters; reset with jabs and footwork.",
			patchTag: "1.09",
			tags: ["stamina", "power", "counter"],
			links: ["https://youtu.be/dummy-ufc5-stamina"]
		},
		{
			code: "UFC5-CLINCH-002",
			title: "Clinch reset vs jab exploit",
			description: "Break rhythm after 2 jabs with clinch touch or lateral step to desync timing.",
			patchTag: "1.09",
			tags: ["clinch", "jab", "timing"],
			links: ["https://youtu.be/dummy-ufc5-clinch"]
		},
	],
	"NBA 2K26": [
		{
			code: "2K26-TRANS-001",
			title: "Tempo control after transition",
			description: "If spacing collapses post-transition, slow the next trip and force a weak-side switch.",
			patchTag: "1.03",
			tags: ["spacing", "tempo", "switching"],
		},
		{
			code: "2K26-HEDGE-002",
			title: "Hedge vs fast-break teams",
			description: "Post 1.03, hedge beats quick triggers; pre-rotate the corner tagger to cover slip.",
			patchTag: "1.03",
			tags: ["defense", "hedge", "rotation"],
			links: ["https://youtu.be/dummy-2k26-hedge"]
		},
	],
	"UNDISPUTED": [],
	"FIGHT NIGHT CHAMPION": [],
	"MADDEN 26": [],
}

function synthesizeRules(game: string, base: any[]): any[] {
    const seeds: Record<string, { prefix: string; items: { key: string; title: string; desc: string; tags: string[] }[] }> = {
        "UFC 5": {
            prefix: "UFC5",
            items: [
                { key: "STAMINA-45", title: "Under 45% stamina limit exchanges", desc: "Under 45% stamina → max 3 strikes → reset footwork.", tags: ["stamina","timing"] },
                { key: "RHYTHM-LOOP", title: "Break fixed 1–2 rhythm", desc: "Insert half-beat delays and feints every third entry.", tags: ["timing","feint"] },
                { key: "PULL-COUNTER", title: "Avoid stepping into pull-counter windows", desc: "Reset back-left/neutral, re-enter on third beat.", tags: ["counter","movement"] },
                { key: "SIDE-DASH-HOOK", title: "Side dash + hook trap check", desc: "Mirror step guard then jab check and pivot exit.", tags: ["trap","angle"] },
                { key: "BLOCK-BREAK", title: "Block-break bait counterplan", desc: "Slip-jab → frame-off → exit; don’t turtle in elbow range.", tags: ["block","elbow"] },
                { key: "BODY-TAX", title: "Body-kick tax response", desc: "Pre-plan checks, catch-kick, and stamina race discipline.", tags: ["body","stamina"] },
            ]
        },
        "UNDISPUTED": {
            prefix: "UND",
            items: [
                { key: "MOVE-META", title: "Circle-step + pivot meta handling", desc: "Feint feet first; tag exit lanes; never chase same lane twice.", tags: ["movement","pivot"] },
                { key: "BODY-TAX", title: "Body-shot tax openers", desc: "Open block-body bias; jab-check, then exit to center.", tags: ["body","stamina"] },
                { key: "STRAIGHT-SPAM", title: "Straight spam timing war", desc: "Half-beat delays and feints; punish second beat.", tags: ["timing","straight"] },
                { key: "PRESSURE-TRAP", title: "Forward-walk block pressure trap", desc: "Back-step feint then pivot; don’t parry into elbows.", tags: ["pressure","trap"] },
                { key: "CLINCH-BREAK", title: "Clinch spam → safe break read", desc: "Underhook and rotate; punish late break with straight.", tags: ["clinch","break"] },
            ]
        },
        "FIGHT NIGHT CHAMPION": {
            prefix: "FNC",
            items: [
                { key: "SS-UC-LOOP", title: "Sidestep → uppercut loop punish", desc: "Enter off-angle; bait sidestep then straight → pivot.", tags: ["sidestep","uppercut"] },
                { key: "LEAN-BAIT", title: "Lean-bait rhythm check", desc: "Jab-tag lean hand; delay counter 0.5 beat.", tags: ["lean","timing"] },
                { key: "STRAIGHT-TRADE", title: "Straight trade advantage loop break", desc: "Feint → slip outside → hook return.", tags: ["straight","trade"] },
                { key: "BLOCK-BREAK", title: "Block-break loop counter", desc: "Frame and pivot; never hold high block in elbow range.", tags: ["block","elbow"] },
                { key: "POCKET-FREEZE", title: "Pocket-freeze panic fix", desc: "Pre-call exit lane before entry; never double-plant.", tags: ["pocket","exit"] },
            ]
        },
        "NBA 2K26": {
            prefix: "2K26",
            items: [
                { key: "PAINT-MASH", title: "Paint mash low-man pre-rotate", desc: "Pre-rotate low man; shade baseline; hands-up contest timing.", tags: ["paint","rotation"] },
                { key: "THREE-HUNT", title: "3-hunt misdirection coverage", desc: "Top-lock hand; trail from hip; late switch with low-man ready.", tags: ["three","switch"] },
                { key: "STAMINA-RACE", title: "Stamina race rules", desc: "Green windows shrink under fatigue; attack early clock.", tags: ["stamina","timing"] },
                { key: "ROTATION-LATE", title: "Late rotation cue", desc: "Tag roller early; bump to corner; communicate switch.", tags: ["rotation","defense"] },
                { key: "MISDIRECTION", title: "Off-ball bait reads", desc: "Don’t over-help strong; scram switch on slips.", tags: ["offball","bait"] },
            ]
        },
        "MADDEN 26": {
            prefix: "M26",
            items: [
                { key: "PA-CROSSERS", title: "PA crossers counter shell", desc: "FS middle third + QB contain; force checkdown.", tags: ["pa","crosser"] },
                { key: "MESH-DRAGS", title: "Mesh/drags shallow hook control", desc: "User MLB sit 3–7 yds; shade inside; rally tackle.", tags: ["mesh","mlb"] },
                { key: "STRETCH-SPAM", title: "HB stretch/outside zone spam fix", desc: "Shift front strong; set contain; user B-gap.", tags: ["run","contain"] },
                { key: "TRIPS-TE-CORNER", title: "Trips TE corner spam", desc: "Shade outside; cloud flat; inside third.", tags: ["coverage","trips"] },
                { key: "USER-LURK", title: "User-lurk MLB/Safety bait", desc: "Throw early timing routes; avoid late windows.", tags: ["user","bait"] },
                { key: "EDGE-PRESS-MAN", title: "Edge blitz press-man plan", desc: "Motion snap + quick flat or streak speed mismatch.", tags: ["blitz","press"] },
            ]
        },
    }

    const seed = seeds[game]
    if (!seed) return base
    const out = [...base]
    // expand to at least 50 items by repeating themed variants
    let i = 0
    while (out.length < 50) {
        const item = seed.items[i % seed.items.length]
        const idx = Math.floor(out.length / seed.items.length) + 1
        out.push({
            code: `${seed.prefix}-${item.key}-${String(idx).padStart(2, '0')}`,
            title: item.title,
            description: item.desc,
            patchTag: "meta",
            tags: item.tags,
            links: ["https://youtu.be/dummy-meta"]
        })
        i++
    }
    return out
}

export function getFallbackRules(game?: string) {
    if (game) {
        const base = FALLBACK_RULES[game] || []
        return synthesizeRules(game, base)
    }
    // no specific game: flatten samples
    return Object.entries(FALLBACK_RULES).flatMap(([g, arr]) => synthesizeRules(g, arr)).slice(0, 10)
}


