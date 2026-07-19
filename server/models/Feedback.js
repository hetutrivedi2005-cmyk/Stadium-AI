import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: String, // Firebase UID or anonymous
      default: 'anonymous',
      index: true,
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      required: [true, 'Rating is required'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      default: '',
    },
    category: {
      type: String,
      enum: ['general', 'navigation', 'ai-assistant', 'transit', 'accessibility', 'safety', 'app-performance'],
      default: 'general',
      index: true,
    },
    stadium: { type: String, trim: true, index: true },
  },
  { timestamps: true, versionKey: false }
);

feedbackSchema.index({ rating: 1, createdAt: -1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
