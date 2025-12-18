import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { Analysis } from "@/models/Analysis"

export const runtime = "nodejs"

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const sessionId = (searchParams.get("sessionId") || "").trim()
    const analysisId = (searchParams.get("analysisId") || "").trim()
    if (!sessionId) return NextResponse.json({ ok: false, error: "Missing sessionId" }, { status: 400 })

    if (analysisId) {
      await Analysis.deleteOne({ _id: analysisId, userId: sessionId })
    } else {
      await Analysis.deleteMany({ userId: sessionId })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed" }, { status: 500 })
  }
}


