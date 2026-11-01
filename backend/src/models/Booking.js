import mongoose from 'mongoose';

export const BOOKING_STATUSES = ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'rejected'];
export const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed', 'checked_in'];
export const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'];
export const PAYMENT_METHODS = ['vnpay', 'cash'];

const bookingSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true },
    guests: { type: Number, required: true, min: 1 },
    pricePerNight: { type: Number, required: true },
    cleaningFee: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    subtotal: { type: Number },
    couponCode: { type: String, default: '' },
    discount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    contactName: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    note: { type: String, default: '' },
    paymentMethod: { type: String, enum: { values: PAYMENT_METHODS, message: 'Phương thức thanh toán không hợp lệ' }, default: 'cash' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'unpaid' },
    status: { type: String, enum: BOOKING_STATUSES, default: 'pending' },
    cancelReason: { type: String, default: '' },
    paidAt: { type: Date },
    vnpTxnRef: { type: String },
    isReviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bookingSchema.pre('validate', function ensureSubtotal() {
  if (this.subtotal === undefined || this.subtotal === null) {
    this.subtotal = (this.pricePerNight || 0) * (this.nights || 0);
  }
});

bookingSchema.index({ room: 1, status: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ owner: 1, createdAt: -1 });

bookingSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Booking', bookingSchema);
