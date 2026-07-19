import mongoose from 'mongoose';

const weatherCacheSchema = new mongoose.Schema(
  {
    stadium: {
      type: String,
      required: [true, 'Stadium identifier is required'],
      trim: true,
      index: true,
    },
    temperature: { type: Number },
    feelsLike: { type: Number },
    humidity: { type: Number },
    wind: { type: Number },
    windDirection: { type: String },
    condition: { type: String, trim: true },
    conditionDesc: { type: String, trim: true },
    uvIndex: { type: Number, default: 0 },
    rainProbability: { type: Number, default: 0 },
    visibility: { type: Number, default: 0 },
    pressure: { type: Number },
    lat: { type: Number },
    lon: { type: Number },
    apiTimestamp: { type: Date },
    cachedAt: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

// TTL index: auto-expire cached entries after 30 minutes
weatherCacheSchema.index({ cachedAt: 1 }, { expireAfterSeconds: 1800 });
weatherCacheSchema.index({ stadium: 1, cachedAt: -1 });

const WeatherCache = mongoose.model('WeatherCache', weatherCacheSchema);
export default WeatherCache;
