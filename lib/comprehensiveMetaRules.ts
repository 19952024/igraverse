// Comprehensive Meta Rules Library - 50+ rules per game
// Structured for competitive online meta with patch tags

export const COMPREHENSIVE_META_RULES: Record<string, Array<{
	code: string
	title: string
	description: string
	patchTag?: string
	tags?: string[]
	links?: string[]
}>> = {
	"UFC 5": Array.from({ length: 50 }, (_, i) => {
		const categories = [
			{ prefix: "STAMINA", tag: "stamina_drop", patches: ["1.09", "1.10"] },
			{ prefix: "COUNTER", tag: "missed_counter", patches: ["1.08", "1.09"] },
			{ prefix: "CLINCH", tag: "clinch_spam", patches: ["1.09", "1.10"] },
			{ prefix: "POWER", tag: "power_chain_low_stamina", patches: ["1.09"] },
			{ prefix: "DEFENSE", tag: "defensive_mistake", patches: ["1.08", "1.09", "1.10"] },
			{ prefix: "COMBO", tag: "combo_efficiency", patches: ["1.09", "1.10"] },
		]
		const cat = categories[i % categories.length]
		const num = String(Math.floor(i / categories.length) + 1).padStart(3, "0")
		const patch = cat.patches[i % cat.patches.length]
		
		const templates: Record<string, string[]> = {
			STAMINA: [
				"Stamina threshold at 40%: reset pace or get countered",
				"Post-1.09: power chains below 50% stamina expose counter windows",
				"Stamina regen rate decreased in ranked; manage bursts",
				"Low-stamina entries get read: use feints to bait counters",
				"Stamina pacing in rounds 3-5: alternate body/head to preserve",
			],
			COUNTER: [
				"Counter timing window tightened in 1.09: delayed counters more effective",
				"Missed counter at jab range: step back then return on third beat",
				"Lead hook spam: counter with delayed straight or uppercut",
				"Counter-feint meta: bait counter then counter their counter",
				"Body counter timing: punish low-stamina body attempts",
			],
			CLINCH: [
				"Clinch spam detection: break after 2 clinch attempts with lateral step",
				"Clinch reset beats jab exploit: desync timing after 2-3 jabs",
				"Post-1.09 clinch nerf: use sparingly, not for spam",
				"Clinch escape timing: wait for opponent commit then break",
				"Clinch control meta: dominate clinch or avoid entirely",
			],
			POWER: [
				"Power spam under 50% stamina: gets blown up by delayed counters",
				"Power chain efficiency drops below 45% stamina in ranked",
				"Power timing: use after stamina reset or on stunned opponent",
				"Power vs stamina management: prioritize stamina over damage",
				"Low-stamina power exposes: reset with jabs before committing",
			],
			DEFENSE: [
				"Block/parry timing: 1.09 tightened windows; commit earlier",
				"Defensive mistake patterns: predict opponent rhythm then counter",
				"Failed block recovery: step back before opponent capitalizes",
				"Parry vs block: parry for counters, block for safety",
				"Defensive pacing: don't spam blocks; vary timing",
			],
			COMBO: [
				"Combo efficiency tracking: land rate drops below 60% at low stamina",
				"Combo patterns: 2-3 hit chains more effective than long chains",
				"Combo reset timing: break rhythm every 2-3 combos",
				"Combo vs counter meta: short combos beat long in ranked",
				"Combo accuracy: aim for 70%+ land rate for efficiency",
			],
		}
		
		const descPool = templates[cat.prefix] || [templates.STAMINA[0]]
		const desc = descPool[i % descPool.length]
		
		return {
			code: `UFC5-${cat.prefix}-${num}`,
			title: desc.split(":")[0].trim(),
			description: desc,
			patchTag: patch,
			tags: [cat.tag, ...cat.patches],
		}
	}),
	"NBA 2K26": Array.from({ length: 50 }, (_, i) => {
		const categories = [
			{ prefix: "SPACING", tag: "spacing_breakdown", patches: ["1.03", "1.04"] },
			{ prefix: "SHOT", tag: "shot_timing", patches: ["1.03", "1.04", "1.05"] },
			{ prefix: "ROTATION", tag: "defensive_rotation", patches: ["1.03", "1.04"] },
			{ prefix: "TRANSITION", tag: "transition_tempo", patches: ["1.03", "1.04"] },
			{ prefix: "PAINT", tag: "paint_mash", patches: ["1.03"] },
			{ prefix: "STAMINA", tag: "stamina_management", patches: ["1.03", "1.04"] },
		]
		const cat = categories[i % categories.length]
		const num = String(Math.floor(i / categories.length) + 1).padStart(3, "0")
		const patch = cat.patches[i % cat.patches.length]
		
		const templates: Record<string, string[]> = {
			SPACING: [
				"Spacing breakdown post-transition: slow next trip, force weak-side switch",
				"Spacing thresholds: maintain 4+ unit spacing or get exploited",
				"Spacing recovery: use delay screen to reset spacing",
				"Spacing vs fast break: pre-position defenders before transition",
				"Spacing breakdown after 3 possessions: systematic issue",
			],
			SHOT: [
				"Shot timing window: release within green window or get contested",
				"Shot release timing: 1.03 tightened green zones",
				"Shot selection: avoid contested shots, prioritize open looks",
				"Shot timing vs spacing: create space before shooting",
				"Shot efficiency tracking: aim for 45%+ from 3 in ranked",
			],
			ROTATION: [
				"Defensive rotation speed: rotate before opponent commits",
				"Rotation timing: pre-rotate corner tagger on weak side",
				"Hedge vs fast-break teams: post-1.03 hedge beats quick triggers",
				"Rotation coverage: weak-side help before paint entry",
				"Rotation efficiency: reduce rotation lag for better coverage",
			],
			TRANSITION: [
				"Transition tempo control: slow after spacing breakdown",
				"Fast break spacing: maintain spacing during transition",
				"Transition defense: hedge before opponent gets momentum",
				"Transition offense: exploit slow rotations",
				"Transition timing: force switch during transition chaos",
			],
			PAINT: [
				"Paint mashing detection: bait with half step, then hold position",
				"Paint mash counter: force switches after 3 possessions",
				"Paint defense: stagger help from weak side",
				"Paint timing: make them finish over hands",
				"Paint rhythm: kill mash rhythm with defensive resets",
			],
			STAMINA: [
				"Player stamina during play: manage for 4th quarter",
				"Stamina pacing: alternate starters to preserve stamina",
				"Stamina thresholds: rest players below 70% stamina",
				"Stamina vs performance: efficiency drops below 60%",
				"Stamina management: use timeouts strategically",
			],
		}
		
		const descPool = templates[cat.prefix] || [templates.SPACING[0]]
		const desc = descPool[i % descPool.length]
		
		return {
			code: `2K26-${cat.prefix}-${num}`,
			title: desc.split(":")[0].trim(),
			description: desc,
			patchTag: patch,
			tags: [cat.tag, ...cat.patches],
		}
	}),
	"FIGHT NIGHT CHAMPION": Array.from({ length: 50 }, (_, i) => {
		const categories = [
			{ prefix: "STAMINA", tag: "stamina_drop", patches: ["meta"] },
			{ prefix: "COMBO", tag: "combo_patterns", patches: ["meta"] },
			{ prefix: "DISTANCE", tag: "distance_control", patches: ["meta"] },
			{ prefix: "PARRY", tag: "parry_timing", patches: ["meta"] },
			{ prefix: "COUNTER", tag: "counter_opportunity", patches: ["meta"] },
			{ prefix: "BALANCE", tag: "body_head_balance", patches: ["meta"] },
		]
		const cat = categories[i % categories.length]
		const num = String(Math.floor(i / categories.length) + 1).padStart(3, "0")
		
		const templates: Record<string, string[]> = {
			STAMINA: [
				"Stamina in rounds 3-5: alternate body/head to preserve stamina",
				"Stamina pacing: prioritize ring craft over volume",
				"Stamina threshold: red stamina exposes counter windows",
				"Stamina regen: manage bursts to maintain stamina",
				"Stamina vs damage: low stamina = higher damage taken",
			],
			COMBO: [
				"Combo efficiency: 2-3 hit chains more effective than long chains",
				"Combo patterns: break rhythm every 2-3 combos",
				"Combo vs counter: short combos beat long in ranked",
				"Combo accuracy: aim for 70%+ land rate",
				"Combo timing: use after creating openings",
			],
			DISTANCE: [
				"Distance control: maintain optimal range for power",
				"Distance violations: too close = counter risk",
				"Distance management: use footwork to control range",
				"Distance vs timing: control distance before committing",
				"Distance recovery: reset distance after exchanges",
			],
			PARRY: [
				"Parry timing window: commit earlier for counters",
				"Parry vs block: parry for counters, block for safety",
				"Parry patterns: predict opponent rhythm then parry",
				"Parry recovery: step back after failed parry",
				"Parry efficiency: don't spam parries",
			],
			COUNTER: [
				"Counter opportunity: punish low-stamina attempts",
				"Counter timing: step back then return on third beat",
				"Counter vs combo: counter beats combo spam",
				"Counter efficiency: capitalize on opponent mistakes",
				"Counter patterns: read opponent rhythm",
			],
			BALANCE: [
				"Body/head balance: alternate to drain opponent",
				"Body shot timing: use when opponent guards head",
				"Head shot timing: use when opponent drops guard",
				"Body vs head: balance for efficiency",
				"Body/head mix: vary to keep opponent guessing",
			],
		}
		
		const descPool = templates[cat.prefix] || [templates.STAMINA[0]]
		const desc = descPool[i % descPool.length]
		
		return {
			code: `FNC-${cat.prefix}-${num}`,
			title: desc.split(":")[0].trim(),
			description: desc,
			patchTag: "meta",
			tags: [cat.tag],
		}
	}),
	"UNDISPUTED": Array.from({ length: 50 }, (_, i) => {
		const categories = [
			{ prefix: "COUNTER", tag: "counter_timing", patches: ["meta"] },
			{ prefix: "SPAM", tag: "lead_hook_spam", patches: ["meta"] },
			{ prefix: "STAMINA", tag: "stamina_gassing", patches: ["meta"] },
			{ prefix: "DISTANCE", tag: "distance_control", patches: ["meta"] },
			{ prefix: "DEFENSE", tag: "defensive_mistake", patches: ["meta"] },
			{ prefix: "COMBO", tag: "combo_efficiency", patches: ["meta"] },
		]
		const cat = categories[i % categories.length]
		const num = String(Math.floor(i / categories.length) + 1).padStart(3, "0")
		
		const templates: Record<string, string[]> = {
			COUNTER: [
				"Counter timing: micro-step back then return on third beat",
				"Counter vs lead hook spam: punish whiff with straight",
				"Counter window: commit earlier for efficiency",
				"Counter patterns: read opponent rhythm",
				"Counter efficiency: capitalize on mistakes",
			],
			SPAM: [
				"Lead hook spam detection: counter with delayed straight",
				"Spam pattern: break after 2-3 attempts",
				"Spam counter: step back then return",
				"Spam rhythm: kill with defensive resets",
				"Spam timing: exploit spam patterns",
			],
			STAMINA: [
				"Stamina gassing: manage bursts to preserve",
				"Stamina drop rate: track and adjust pace",
				"Stamina threshold: reset below 40%",
				"Stamina vs damage: low stamina = higher damage",
				"Stamina pacing: prioritize stamina management",
			],
			DISTANCE: [
				"Distance control: maintain optimal range",
				"Distance violations: too close = counter risk",
				"Distance management: use footwork",
				"Distance vs timing: control before committing",
				"Distance recovery: reset after exchanges",
			],
			DEFENSE: [
				"Defensive mistake: failed block/duck",
				"Defensive recovery: step back after mistake",
				"Defensive timing: commit earlier",
				"Defensive patterns: predict opponent",
				"Defensive efficiency: don't spam blocks",
			],
			COMBO: [
				"Combo efficiency: land rate tracking",
				"Combo patterns: short chains beat long",
				"Combo timing: use after openings",
				"Combo reset: break rhythm regularly",
				"Combo accuracy: aim for 70%+",
			],
		}
		
		const descPool = templates[cat.prefix] || [templates.COUNTER[0]]
		const desc = descPool[i % descPool.length]
		
		return {
			code: `UND-${cat.prefix}-${num}`,
			title: desc.split(":")[0].trim(),
			description: desc,
			patchTag: "meta",
			tags: [cat.tag],
		}
	}),
	"MADDEN 26": Array.from({ length: 50 }, (_, i) => {
		const categories = [
			{ prefix: "ROTATION", tag: "defensive_rotation", patches: ["launch", "1.01"] },
			{ prefix: "PA", tag: "play_action_read", patches: ["launch", "1.01"] },
			{ prefix: "REACTION", tag: "reaction_frames", patches: ["launch"] },
			{ prefix: "ROUTE", tag: "route_recognition", patches: ["launch", "1.01"] },
			{ prefix: "COVERAGE", tag: "coverage_breakdown", patches: ["launch"] },
			{ prefix: "PRESSURE", tag: "pressure_timing", patches: ["launch", "1.01"] },
		]
		const cat = categories[i % categories.length]
		const num = String(Math.floor(i / categories.length) + 1).padStart(3, "0")
		const patch = cat.patches[i % cat.patches.length]
		
		const templates: Record<string, string[]> = {
			ROTATION: [
				"Defensive rotation speed: rotate before commit",
				"Weak-side stagger vs PA boot: stagger weak safety",
				"Rotation timing: pre-rotate to cover gaps",
				"Rotation coverage: reduce rotation lag",
				"Rotation efficiency: maintain coverage",
			],
			PA: [
				"Play-action read: recognize PA boot patterns",
				"PA boot spam: stagger weak safety to counter",
				"PA timing: read before commit",
				"PA coverage: switch to flat to bait throw",
				"PA patterns: exploit predictable PA",
			],
			REACTION: [
				"Reaction frames: improve to cover routes",
				"Reaction timing: commit earlier",
				"Reaction efficiency: track reaction speed",
				"Reaction vs route: anticipate routes",
				"Reaction improvement: practice recognition",
			],
			ROUTE: [
				"Route recognition: identify route patterns",
				"Route timing: anticipate before commit",
				"Route coverage: adjust coverage to routes",
				"Route patterns: exploit predictable routes",
				"Route efficiency: improve recognition",
			],
			COVERAGE: [
				"Coverage breakdown: identify gaps",
				"Coverage gaps: adjust to fill",
				"Coverage timing: rotate to cover",
				"Coverage efficiency: maintain coverage",
				"Coverage recovery: fix breakdowns",
			],
			PRESSURE: [
				"Pressure timing: blitz at right moments",
				"Blitz timing: coordinate with coverage",
				"Pressure efficiency: time blitzes correctly",
				"Pressure patterns: vary timing",
				"Pressure vs coverage: balance both",
			],
		}
		
		const descPool = templates[cat.prefix] || [templates.ROTATION[0]]
		const desc = descPool[i % descPool.length]
		
		return {
			code: `MAD26-${cat.prefix}-${num}`,
			title: desc.split(":")[0].trim(),
			description: desc,
			patchTag: patch,
			tags: [cat.tag, ...cat.patches],
		}
	}),
}

