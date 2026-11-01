import mongoose from 'mongoose';

export const REPORT_REASONS = ['sai_thong_tin', 'lua_dao', 've_sinh', 'thai_do', 'khac'];
export const REPORT_STATUSES = ['pending', 'resolved', 'rejected'];
export const REPORT_REASON_LABELS = {
  sai_thong_tin: 'Thông tin sai sự thật',
  lua_dao: 'Nghi lừa đảo',
  ve_sinh: 'Vệ sinh kém',
  thai_do: 'Thái độ chủ phòng',
  khac: 'Khác',
};

const reportSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, enum: { values: REPORT_REASONS, message: 'Lý do không hợp lệ' }, required: [true, 'Vui lòng chọn lý do'] },
    description: { type: String, default: '', trim: true, maxlength: [2000, 'Mô tả tối đa 2000 ký tự'] },
    status: { type: String, enum: REPORT_STATUSES, default: 'pending' },
    adminNote: { type: String, default: '' },
    roomHidden: { type: Boolean, default: false },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporter: 1, createdAt: -1 });

reportSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Report', reportSchema);
