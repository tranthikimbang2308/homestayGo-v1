import mongoose from 'mongoose';

export const CONTACT_STATUSES = ['new', 'replied', 'closed'];

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Vui lòng nhập họ tên'], trim: true, maxlength: 100 },
    email: { type: String, required: [true, 'Vui lòng nhập email'], trim: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'] },
    phone: { type: String, default: '', trim: true, maxlength: 20 },
    subject: { type: String, default: '', trim: true, maxlength: 200 },
    message: { type: String, required: [true, 'Vui lòng nhập nội dung'], trim: true, maxlength: [3000, 'Nội dung tối đa 3000 ký tự'] },
    status: { type: String, enum: CONTACT_STATUSES, default: 'new' },
    reply: { type: String, default: '' },
    repliedAt: { type: Date },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

contactSchema.index({ status: 1, createdAt: -1 });

contactSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Contact', contactSchema);
