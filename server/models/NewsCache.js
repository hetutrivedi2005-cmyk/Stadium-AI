import mongoose from 'mongoose';

const newsCacheSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    source: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    url: { type: String, trim: true, default: '' },
    urlToImage: { type: String, default: null },
    category: {
      type: String,
      enum: ['football', 'world-cup', 'stadium', 'transport', 'weather', 'general'],
      default: 'general',
      index: true,
    },
    query: { type: String, trim: true, index: true },
    publishedAt: { type: Date },
    cachedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false, versionKey: false }
);

// TTL index: auto-expire news after 1 hour
newsCacheSchema.index({ cachedAt: 1 }, { expireAfterSeconds: 3600 });
newsCacheSchema.index({ query: 1, cachedAt: -1 });

const NewsCache = mongoose.model('NewsCache', newsCacheSchema);
export default NewsCache;
