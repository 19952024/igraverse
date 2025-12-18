// 6 Event Tags per Game - Structured event detection categories
export const EVENT_TAGS: Record<string, string[]> = {
	"UFC 5": [
		"stamina_drop", // HUD: stamina < 45%
		"missed_counter", // Timing: counter window missed
		"pull_counter_window", // Forward step on reset opens pull-counter
		"side_dash_hook", // Side dash + hook trap
		"block_break_bait", // Elbow/knee block-break bait chains
		"rhythm_loop", // Fixed entry timing (1–2, pause, reset)
	],
	"NBA 2K26": [
		"paint_mash", // Repeated paint attempts after broken plays
		"three_hunt", // 3-hunt with misdirection and late switches
		"spacing_breakdown", // Spacing collapse events
		"rotation_late", // Late low-man/weak-side rotations
		"stamina_race", // Stamina race losing patterns
		"misdirection", // Off-ball bait/misdirection reads
	],
	"FIGHT NIGHT CHAMPION": [
		"sidestep_uppercut", // Sidestep → uppercut loop
		"lean_bait", // Repeated lean baits
		"straight_trade", // Straight trade advantage loops
		"block_break_loop", // Block-break loop abuse
		"pocket_freeze", // Pocket freeze panic moments
		"parry_timing", // Parry timing issues
	],
	"UNDISPUTED": [
		"movement_meta", // Circle-step + pivot offense
		"body_tax", // Body-shot tax meta
		"infighting_trap", // Elbow-range infighting traps
		"straight_spam", // Straight-spam timing wars
		"pressure_trap", // Forward-walk block pressure trap
		"clinch_spam_break", // Clinch spam into safe break
	],
	"MADDEN 26": [
		"pa_crossers", // Play-action crossers spam
		"mesh_drags", // Mesh/drags YAC farming
		"stretch_spam", // HB stretch/outside zone spam
		"trips_te_corner", // Trips TE corner spam
		"user_lurk", // User-lurk MLB/Safety every play
		"edge_press_man", // Edge blitz with press man
	],
}

export function getEventTagsForGame(game: string): string[] {
	return EVENT_TAGS[game] || EVENT_TAGS["UFC 5"]
}

