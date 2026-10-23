import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

export async function connectDb(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export function dbState() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] ?? 'unknown';
}
