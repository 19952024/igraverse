import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { Analysis } from "@/models/Analysis"
import { EventFeedback } from "@/models/EventFeedback"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
	try {
		let dbReady = true
		try {
			await connectToDatabase()
		} catch {
			dbReady = false
		}

		const { analysisId, eventIndex, timecode, helped, sessionId, feedback } = await req.json()

		if (!analysisId || typeof eventIndex !== "number" || typeof helped !== "boolean") {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
		}

		if (dbReady) {
			// Save feedback
			await EventFeedback.create({
				sessionId,
				analysisId,
				eventIndex,
				timecode: timecode || 0,
				helped,
				feedback,
			})

			// Update event feedback counts
			const analysis = await Analysis.findById(analysisId)
			if (analysis && analysis.events?.[eventIndex]) {
				const event = analysis.events[eventIndex]
				if (!event.feedback) event.feedback = { helped: 0, notHelped: 0 }
				if (helped) {
					event.feedback.helped = (event.feedback.helped || 0) + 1
				} else {
					event.feedback.notHelped = (event.feedback.notHelped || 0) + 1
				}
				await analysis.save()
			}
		}

		return NextResponse.json({ ok: true })
	} catch (err: any) {
		return NextResponse.json({ error: err.message || "Feedback failed" }, { status: 500 })
	}
}

