import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: [true, 'Vui lòng chọn số sao'], min: [1, 'Số sao từ 1 đến 5'], max: [5, 'Số sao từ 1 đến 5'] },
    comment: { type: String, default: '' },
    ownerReply: { type: String, default: '' },
    repliedAt: { type: Date },
    isHidden: { type: Boolean, default: false },
    hiddenReason: { type: String, default: '' },
    hiddenAt: { type: Date },
  },
  { timestamps: true }
);

reviewSchema.index({ room: 1, createdAt: -1 });

reviewSchema.statics.recalcRoomRating = async function recalcRoomRating(roomId) {
  const [result] = await this.aggregate([
    { $match: { room: new mongoose.Types.ObjectId(String(roomId)), isHidden: { $ne: true } } },
    { $group: { _id: '$room', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await mongoose.model('Room').findByIdAndUpdate(roomId, {
    ratingAvg: result ? Math.round(result.avg * 10) / 10 : 0,
    ratingCount: result ? result.count : 0,
  });
};

reviewSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Review', reviewSchema);
