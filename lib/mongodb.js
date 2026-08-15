import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;

const globalForMongo = globalThis;

export async function connectToDatabase() {
  if (!uri) {
    throw new Error('MONGODB_URI is not set in .env.local');
  }
  if (!globalForMongo.mongoClient) {
    const client = new MongoClient(uri);
    globalForMongo.mongoClient = await client.connect();
  }
  const db = globalForMongo.mongoClient.db();
  await ensureIndexes(db);
  return db;
}

async function ensureIndexes(db) {
  if (globalForMongo.mongoIndexesReady) return;
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('playlists').createIndex({ slug: 1 }, { unique: true }),
    db.collection('playlists').createIndex({ userId: 1 }),
  ]);
  globalForMongo.mongoIndexesReady = true;
}

export function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}