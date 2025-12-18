import mongoose, { Schema, model, models } from "mongoose"

export interface EventFeedbackDoc extends mongoose.Document {
	sessionId?: string
	userId?: string
	analysisId: string
	eventIndex: number // Index in events array
	timecode: number
	helped: boolean
	feedback?: string
}

const EventFeedbackSchema = new Schema<EventFeedbackDoc>(
	{
		sessionId: String,
		userId: String,
		analysisId: { type: String, required: true, index: true },
		eventIndex: { type: Number, required: true },
		timecode: { type: Number, required: true },
		helped: { type: Boolean, required: true },
		feedback: String,
	},
	{ timestamps: true }
)

export const EventFeedback = models.EventFeedback || model<EventFeedbackDoc>("EventFeedback", EventFeedbackSchema)

