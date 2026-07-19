import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const RETRY_DELAY_MS = 3000;

const connectDB = async () => {
  const srvUri = process.env.MONGODB_URI;
  const directUri = process.env.MONGODB_DIRECT_URI;

  if (!srvUri) {
    console.error('❌ FATAL: MONGODB_URI is not defined in .env file. Shutting down.');
    process.exit(1);
  }

  const baseOptions = {
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,
    maxPoolSize: 10,
    minPoolSize: 1,
    dbName: 'stadiumai',
  };

  // Strategy 1: Try SRV connection string
  const trySRV = async () => {
    console.log('🔄 Attempting MongoDB Atlas SRV connection...');
    await mongoose.connect(srvUri, { ...baseOptions, serverSelectionTimeoutMS: 12000, family: 4 });
  };

  // Strategy 2: Try direct hosts connection (bypasses SRV DNS lookup)
  const tryDirect = async () => {
    if (!directUri) throw new Error('No MONGODB_DIRECT_URI defined');
    console.log('🔄 Attempting MongoDB Atlas direct host connection...');
    await mongoose.connect(directUri, { ...baseOptions, serverSelectionTimeoutMS: 15000, tls: true });
  };

  const strategies = [trySRV, tryDirect];

  for (let i = 0; i < strategies.length; i++) {
    try {
      await strategies[i]();
      console.log(`✅ MongoDB Atlas connected → DB: ${mongoose.connection.name} | Host: ${mongoose.connection.host}`);

      mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected.'));
      mongoose.connection.on('reconnected', () => console.log('✅ MongoDB reconnected.'));
      mongoose.connection.on('error', (err) => console.error('❌ MongoDB error:', err.message));

      process.on('SIGINT', async () => {
        try { await mongoose.connection.close(); } catch (_) {}
        console.log('🔌 MongoDB connection closed.');
        process.exit(0);
      });

      return; // Connected — exit
    } catch (err) {
      console.error(`❌ Strategy ${i + 1} failed: ${err.message}`);
      if (i < strategies.length - 1) {
        console.log(`🔄 Trying next strategy in ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        // Reset connection state for next attempt
        if (mongoose.connection.readyState !== 0) {
          await mongoose.disconnect().catch(() => {});
        }
      }
    }
  }

  console.warn('⚠️  All MongoDB connection strategies exhausted. Running in OFFLINE mode.');
  console.warn('⚠️  Please whitelist your IP at: https://cloud.mongodb.com → Network Access');
};

export default connectDB;
