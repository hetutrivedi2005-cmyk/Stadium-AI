import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: [true, 'Firebase UID is required'],
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      index: true,
    },
    role: {
      type: String,
      enum: ['fan', 'volunteer', 'organizer', 'security', 'medical-staff', 'admin'],
      default: 'fan',
      index: true,
    },
    photo: { type: String, default: null },
    phone: { type: String, trim: true, default: null },
    language: { type: String, default: 'en' },
    favoriteTeam: { type: String, trim: true, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

userSchema.index({ role: 1, isActive: 1 });

const User = mongoose.model('User', userSchema);
export default User;
