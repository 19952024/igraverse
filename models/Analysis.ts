import mongoose, { Schema, model, models } from "mongoose"

export interface AnalysisEvent {
	timecode: number
	label: string // "What happened" summary
	eventTag?: string // One of 6 tags per game
	confidence?: number
	metrics?: Record<string, number>
	hudReads?: {
		stamina?: number
		health?: number
		timer?: number
		[key: string]: number | undefined
	}
	whatHappened?: string // Detailed description
	whyOnline?: string // Why this matters in ranked/online
	whatToDo?: string // Specific action to take
	drill?: string // Practice drill
	receipts?: string[] // Links/examples to competitive clips
	metaTips?: string[]
	ruleRefs?: string[]
	feedback?: {
		helped?: number
		notHelped?: number
	}
}

export interface AnalysisDoc extends mongoose.Document {
	userId?: string
	game: string
	inputType: "upload" | "link"
	inputRef: string
	status: "queued" | "processing" | "completed" | "failed"
	language?: string
	stats?: Record<string, number>
	events: AnalysisEvent[]
	summary?: string
}

const EventSchema = new Schema<AnalysisEvent>(
	{
		timecode: { type: Number, required: true },
		label: { type: String, required: true },
		eventTag: String,
		confidence: Number,
		metrics: Schema.Types.Mixed,
		hudReads: Schema.Types.Mixed,
		whatHappened: String,
		whyOnline: String,
		whatToDo: String,
		drill: String,
		receipts: [String],
		metaTips: [String],
		ruleRefs: [String],
		feedback: Schema.Types.Mixed,
	},
	{ _id: false }
)

const AnalysisSchema = new Schema<AnalysisDoc>(
	{
		userId: String,
		game: { type: String, index: true, required: true },
		inputType: { type: String, enum: ["upload", "link"], required: true },
		inputRef: { type: String, required: true },
		status: { type: String, enum: ["queued", "processing", "completed", "failed"], default: "queued" },
		language: String,
		stats: Schema.Types.Mixed,
		events: { type: [EventSchema], default: [] },
		summary: String,
	},
	{ timestamps: true }
)

export const Analysis = models.Analysis || model<AnalysisDoc>("Analysis", AnalysisSchema)


