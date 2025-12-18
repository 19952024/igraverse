import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { MetaRule } from "@/models/MetaRule"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
	try {
		await connectToDatabase()
		const { searchParams } = new URL(req.url)
		const game = searchParams.get("game") || undefined
		const q = game ? { game } : {}
		const rules = await MetaRule.find(q).limit(200).lean()
		return NextResponse.json({ rules })
	} catch (err: any) {
		return NextResponse.json({ error: err.message || "Failed to load rules" }, { status: 500 })
	}
}


