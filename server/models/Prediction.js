import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema(
  {
    predictionType: {
      type: String,
      enum: ['crowd-density', 'egress-flow', 'incident-risk', 'weather-impact', 'other'],
      default: 'crowd-density',
      index: true,
    },
    input: {
      occupancy: { type: Number, min: 0, max: 100 },
      timing: String,
      weather: String,
      stadium: String,
    },
    output: {
      confidence: { type: Number, min: 0, max: 100 },
      alerts: [
        {
          level: { type: String, enum: ['danger', 'warn', 'info'] },
          title: String,
          desc: String,
        },
      ],
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    generatedByAI: { type: Boolean, default: true },
    stadium: { type: String, trim: true, index: true },
    requestedBy: { type: String, default: 'system' },
  },
  { timestamps: true, versionKey: false }
);

predictionSchema.index({ predictionType: 1, createdAt: -1 });

const Prediction = mongoose.model('Prediction', predictionSchema);
export default Prediction;
