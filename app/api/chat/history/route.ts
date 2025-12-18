import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { ChatMessage } from "@/models/ChatMessage"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
	try {
		await connectToDatabase()
		const { searchParams } = new URL(req.url)
		const sessionId = (searchParams.get("sessionId") || "").trim()
		const limit = Math.min(Number(searchParams.get("limit") || 20), 100)
		if (!sessionId) return NextResponse.json({ messages: [] })
		const msgs = await ChatMessage.find({ sessionId }).sort({ createdAt: 1 }).limit(limit).lean()
		return NextResponse.json({ messages: msgs.map((m: any) => ({ id: String(m._id), role: m.role, content: m.content })) })
	} catch {
		// if DB not available, return empty to keep UX smooth
		return NextResponse.json({ messages: [] })
	}
}

export async function DELETE(req: NextRequest) {
	try {
		await connectToDatabase()
		const { searchParams } = new URL(req.url)
		const sessionId = (searchParams.get("sessionId") || "").trim()
		const messageId = (searchParams.get("messageId") || "").trim()
		if (!sessionId) return NextResponse.json({ ok: false, error: "Missing sessionId" }, { status: 400 })
		if (messageId) {
			await ChatMessage.deleteOne({ _id: messageId, sessionId })
		} else {
			await ChatMessage.deleteMany({ sessionId })
		}
		return NextResponse.json({ ok: true })
	} catch (e: any) {
		return NextResponse.json({ ok: false, error: e?.message || "Failed" }, { status: 500 })
	}
}


