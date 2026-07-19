import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Incident title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Incident description is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    category: {
      type: String,
      enum: ['security', 'medical', 'crowd', 'infrastructure', 'logistics', 'other'],
      default: 'other',
      index: true,
    },
    location: {
      type: String,
      trim: true,
      default: 'Unknown',
    },
    stadium: {
      type: String,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    reportedBy: {
      type: String, // Firebase UID
      trim: true,
    },
    assignedVolunteer: {
      type: String,
      trim: true,
      default: null,
    },
    aiGenerated: { type: Boolean, default: false },
    aiPlaybook: {
      risk: String,
      riskClass: String,
      summary: String,
      action: String,
      volunteers: String,
      emergency: String,
    },
  },
  { timestamps: true, versionKey: false }
);

incidentSchema.index({ status: 1, createdAt: -1 });
incidentSchema.index({ stadium: 1, status: 1 });

const Incident = mongoose.model('Incident', incidentSchema);
export default Incident;
