import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { promises as fs } from "fs"
import path from "path"

export const runtime = "nodejs"

const UPLOAD_DIR = path.join(process.cwd(), "uploads")

export async function POST(req: NextRequest) {
	try {
		const form = await req.formData()
		const file = form.get("file") as unknown as File
		if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 })

		const id = randomUUID()
		await fs.mkdir(UPLOAD_DIR, { recursive: true })
		const arrayBuffer = await file.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)
		const filePath = path.join(UPLOAD_DIR, `${id}.mp4`)
		await fs.writeFile(filePath, buffer)

		return NextResponse.json({ uploadId: id, path: `/uploads/${id}.mp4` })
	} catch (err: any) {
		return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 })
	}
}


