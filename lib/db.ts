import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI as string

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Reuse the connection across hot reloads / serverless invocations.
const globalForMongoose = globalThis as unknown as { mongoose?: MongooseCache }
const cached: MongooseCache = globalForMongoose.mongoose ?? { conn: null, promise: null }
globalForMongoose.mongoose = cached

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined. Add it to your .env file.')
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false })
  }

  try {
    cached.conn = await cached.promise
  } catch (err) {
    cached.promise = null
    throw err
  }

  return cached.conn
}

export default connectToDatabase
