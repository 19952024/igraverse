import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { MetaRule } from "@/models/MetaRule"
import { COMPREHENSIVE_META_RULES } from "@/lib/comprehensiveMetaRules"

export const runtime = "nodejs"

export async function POST(_req: NextRequest) {
	try {
		await connectToDatabase()
		let inserted = 0
		for (const [game, items] of Object.entries(COMPREHENSIVE_META_RULES)) {
			for (const item of items) {
				await MetaRule.updateOne(
					{ game, code: item.code },
					{ $setOnInsert: { ...item, game } },
					{ upsert: true }
				)
				inserted += 1
			}
		}
		return NextResponse.json({ ok: true, inserted })
	} catch (err: any) {
		return NextResponse.json({ error: err.message || "Seed failed" }, { status: 500 })
	}
}


