import mongoose from 'mongoose';
import { generateSlug } from '../utils/slugify.js';

export const ROOM_TYPES = ['entire', 'private', 'dorm', 'villa', 'bungalow'];
export const ROOM_STATUSES = ['pending', 'approved', 'rejected', 'hidden'];
export const AMENITY_KEYS = [
  'wifi', 'ac', 'kitchen', 'parking', 'pool', 'tv', 'washer', 'bbq', 'garden',
  'balcony', 'hot_water', 'pet', 'breakfast', 'mountain_view', 'sea_view',
];

const roomSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: [true, 'Vui lòng nhập tên phòng'], trim: true },
    slug: { type: String, unique: true },
    description: { type: String, default: '' },
    roomType: { type: String, enum: { values: ROOM_TYPES, message: 'Loại phòng không hợp lệ' }, default: 'entire' },
    address: { type: String, default: '' },
    city: { type: String, default: '', trim: true },
    district: { type: String, default: '' },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    pricePerNight: { type: Number, required: [true, 'Vui lòng nhập giá mỗi đêm'], min: [0, 'Giá không hợp lệ'] },
    cleaningFee: { type: Number, default: 0, min: 0 },
    weekendPrice: { type: Number, default: 0, min: [0, 'Giá cuối tuần không hợp lệ'] },
    minNights: { type: Number, default: 1, min: [1, 'Số đêm tối thiểu phải từ 1'] },
    blockedDates: [
      {
        from: { type: Date, required: true },
        to: { type: Date, required: true },
        reason: { type: String, default: '' },
      },
    ],
    maxGuests: { type: Number, default: 2, min: 1 },
    bedrooms: { type: Number, default: 1, min: 0 },
    beds: { type: Number, default: 1, min: 0 },
    bathrooms: { type: Number, default: 1, min: 0 },
    area: { type: Number, default: 0, min: 0 },
    amenities: [{ type: String, enum: { values: AMENITY_KEYS, message: 'Tiện nghi không hợp lệ' } }],
    images: [{ type: String }],
    rules: { type: String, default: '' },
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '12:00' },
    status: { type: String, enum: ROOM_STATUSES, default: 'pending' },
    rejectReason: { type: String, default: '' },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    bookingCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

roomSchema.index({ status: 1, city: 1 });
roomSchema.index({ owner: 1 });

roomSchema.pre('save', async function ensureSlug() {
  if (!this.slug || this.isModified('title')) this.slug = generateSlug(this.title);
});

roomSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Room', roomSchema);
