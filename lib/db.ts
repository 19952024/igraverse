import mongoose from "mongoose"

let isConnected = 0

export async function connectToDatabase(): Promise<typeof mongoose> {
	if (isConnected) return mongoose

	const uri = process.env.MONGODB_URI
	if (!uri) {
		throw new Error("MONGODB_URI is not set in environment variables")
	}

	mongoose.set("strictQuery", true)
	await mongoose.connect(uri, {
		// Keep defaults minimal; Next.js hot-reloads often
		maxPoolSize: 5,
	})
	isConnected = 1
	return mongoose
}

export function getMongoConnectionState(): number {
	return isConnected
}


