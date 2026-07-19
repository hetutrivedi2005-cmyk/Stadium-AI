import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: String, // Firebase UID or 'anonymous'
      default: 'anonymous',
      index: true,
    },
    role: {
      type: String,
      enum: ['fan', 'volunteer', 'organizer', 'security', 'medical-staff', 'admin', 'guest'],
      default: 'guest',
    },
    prompt: {
      type: String,
      required: [true, 'Prompt is required'],
      trim: true,
    },
    response: {
      type: String,
      required: [true, 'Response is required'],
      trim: true,
    },
    language: {
      type: String,
      default: 'en',
    },
    stadium: { type: String, trim: true, index: true },
    weatherContext: {
      temperature: Number,
      condition: String,
      humidity: Number,
    },
    sessionId: { type: String, trim: true, index: true },
    model: { type: String, default: 'Gemini' },
  },
  { timestamps: true, versionKey: false }
);

chatHistorySchema.index({ userId: 1, createdAt: -1 });
chatHistorySchema.index({ sessionId: 1 });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);
export default ChatHistory;
