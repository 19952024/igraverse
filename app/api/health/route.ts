import { NextResponse } from "next/server"
import { connectToDatabase, getMongoConnectionState } from "@/lib/db"

export const runtime = "nodejs"

export async function GET() {
	let mongo = { connected: false as boolean, error: "" as string }
	try {
		await connectToDatabase()
		mongo.connected = getMongoConnectionState() === 1
	} catch (e: any) {
		mongo.error = e?.message || "connect failed"
	}

	const openai = { configured: Boolean(process.env.OPENAI_API_KEY) }

	return NextResponse.json({ mongo, openai })
}


