import mongoose, { Schema, models, model } from "mongoose"

export interface MetaRuleDoc extends mongoose.Document {
	game: string
	code: string
	title: string
	description: string
	patchTag?: string
	links?: { label: string; url: string }[]
	tags?: string[]
}

const MetaRuleSchema = new Schema<MetaRuleDoc>(
	{
		game: { type: String, index: true, required: true },
		code: { type: String, required: true },
		title: { type: String, required: true },
		description: { type: String, required: true },
		patchTag: { type: String },
		links: [{ label: String, url: String }],
		tags: [{ type: String }],
	},
	{ timestamps: true }
)

MetaRuleSchema.index({ game: 1, code: 1 }, { unique: true })

export const MetaRule = models.MetaRule || model<MetaRuleDoc>("MetaRule", MetaRuleSchema)


