import mongoose from 'mongoose';

export const DISCOUNT_TYPES = ['percent', 'fixed'];

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Vui lòng nhập mã giảm giá'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9_-]{3,30}$/, 'Mã chỉ gồm chữ in hoa, số, gạch ngang, gạch dưới (3-30 ký tự)'],
    },
    description: { type: String, default: '', trim: true },
    discountType: { type: String, enum: { values: DISCOUNT_TYPES, message: 'Loại giảm giá không hợp lệ' }, default: 'percent' },
    discountValue: { type: Number, required: [true, 'Vui lòng nhập giá trị giảm'], min: [1, 'Giá trị giảm phải lớn hơn 0'] },
    maxDiscount: { type: Number, default: 0, min: [0, 'Mức giảm tối đa không hợp lệ'] },
    minOrderValue: { type: Number, default: 0, min: [0, 'Giá trị đơn tối thiểu không hợp lệ'] },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    usageLimit: { type: Number, default: 0, min: [0, 'Giới hạn lượt dùng không hợp lệ'] },
    usedCount: { type: Number, default: 0, min: 0 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
    isActive: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.index({ owner: 1, createdAt: -1 });

couponSchema.pre('validate', function checkCoupon() {
  if (this.discountType === 'percent' && this.discountValue > 100) {
    this.invalidate('discountValue', 'Phần trăm giảm không được vượt quá 100');
  }
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate('endDate', 'Ngày kết thúc phải sau ngày bắt đầu');
  }
});

couponSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Coupon', couponSchema);
