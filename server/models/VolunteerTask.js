import mongoose from 'mongoose';

const volunteerTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    assignedTo: {
      type: String, // Firebase UID
      trim: true,
      default: null,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    location: {
      type: String,
      trim: true,
      default: 'General',
    },
    stadium: {
      type: String,
      trim: true,
      index: true,
    },
    deadline: {
      type: Date,
      default: null,
    },
    aiAdvice: {
      type: String,
      trim: true,
      default: null,
    },
    eta: { type: String, default: null },
    distance: { type: String, default: null },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', null],
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

volunteerTaskSchema.index({ status: 1, priority: 1 });
volunteerTaskSchema.index({ assignedTo: 1, status: 1 });

const VolunteerTask = mongoose.model('VolunteerTask', volunteerTaskSchema);
export default VolunteerTask;
