import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, 'Announcement message is required'],
      trim: true,
    },
    language: {
      type: String,
      default: 'en',
      index: true,
    },
    generatedByAI: { type: Boolean, default: false },
    createdBy: {
      type: String, // Firebase UID or 'system'
      default: 'system',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true,
    },
    audience: {
      type: String,
      enum: ['all', 'fans', 'volunteers', 'staff', 'security', 'medical'],
      default: 'all',
    },
    translations: {
      en: String,
      es: String,
      fr: String,
      hi: String,
      ar: String,
      ja: String,
    },
    stadium: { type: String, trim: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

announcementSchema.index({ priority: 1, createdAt: -1 });
announcementSchema.index({ stadium: 1, isActive: 1 });

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
