import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { Analysis } from "@/models/Analysis"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
	try {
		await connectToDatabase()
		const { searchParams } = new URL(req.url)
		const sessionId = (searchParams.get("sessionId") || "").trim()
		if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
		const doc = await Analysis.findOne({ userId: sessionId }).sort({ createdAt: -1 }).lean()
		if (!doc) return NextResponse.json({ analysis: null })
		return NextResponse.json({ analysis: doc, analysisId: String(doc._id) })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 })
	}
}


