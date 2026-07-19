import mongoose from 'mongoose';

const stadiumSchema = new mongoose.Schema(
  {
    stadiumId: {
      type: String,
      required: [true, 'Stadium ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: [true, 'Stadium name is required'], trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    capacity: { type: Number, default: 0 },
    address: { type: String, trim: true, default: '' },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    gates: [{ name: String, location: String, type: String }],
    parking: [{ zone: String, capacity: Number, evChargers: Number }],
    restaurants: [{ name: String, location: String, cuisine: String }],
    foodCourts: [{ name: String, location: String }],
    medicalCenters: [{ name: String, location: String, capacity: Number }],
    washrooms: [{ location: String, accessible: Boolean }],
    fanZones: [{ name: String, location: String }],
    transport: {
      metro: [{ name: String, distance: String }],
      bus: [{ name: String, stops: [String] }],
      taxi: { type: String, default: '' },
    },
    nearbyHotels: [{ name: String, distance: String, rating: Number }],
    nearbyHospitals: [{ name: String, distance: String, phone: String }],
    nearbyPolice: [{ name: String, distance: String, phone: String }],
    openingHours: { type: String, default: '06:00' },
    closingHours: { type: String, default: '23:59' },
    images: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

stadiumSchema.index({ city: 1, country: 1 });

const Stadium = mongoose.model('Stadium', stadiumSchema);
export default Stadium;
