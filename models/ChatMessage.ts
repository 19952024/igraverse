import mongoose, { Schema, model, models } from "mongoose"

export interface ChatMessageDoc extends mongoose.Document {
	sessionId?: string
	userId?: string
	game?: string
	role: "user" | "assistant" | "system"
	content: string
	analysisId?: string
}

const ChatMessageSchema = new Schema<ChatMessageDoc>(
	{
		sessionId: { type: String, index: true },
		userId: { type: String, index: true },
		game: { type: String },
		role: { type: String, enum: ["user", "assistant", "system"], required: true },
		content: { type: String, required: true },
		analysisId: { type: String },
	},
	{ timestamps: true }
)

export const ChatMessage = models.ChatMessage || model<ChatMessageDoc>("ChatMessage", ChatMessageSchema)


