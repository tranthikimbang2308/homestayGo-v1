import mongoose from 'mongoose';

export const DEFAULT_SETTINGS = {
  siteName: 'HomestayGo',
  hotline: '1900 6868',
  email: 'hotro@homestaygo.vn',
  address: '12 Nguyễn Văn Bảo, Gò Vấp, TP. Hồ Chí Minh',
  serviceFeePercent: 5,
  about: 'HomestayGo kết nối du khách với những homestay được chọn lọc trên khắp Việt Nam, giúp việc tìm chỗ ở gần gũi, minh bạch và an tâm hơn.',
  facebook: 'https://facebook.com/homestaygo',
  zalo: '0901234567',
  policies: 'Khách được hủy miễn phí trước ngày nhận phòng tối thiểu 3 ngày. Phí dịch vụ được tính trên tiền phòng và không hoàn lại khi hủy muộn. Chủ phòng chịu trách nhiệm về tính chính xác của thông tin đăng tải.',
};

const settingSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: DEFAULT_SETTINGS.siteName, trim: true },
    hotline: { type: String, default: DEFAULT_SETTINGS.hotline, trim: true },
    email: { type: String, default: DEFAULT_SETTINGS.email, trim: true },
    address: { type: String, default: DEFAULT_SETTINGS.address, trim: true },
    serviceFeePercent: { type: Number, default: 5, min: [0, 'Phí dịch vụ từ 0 đến 30%'], max: [30, 'Phí dịch vụ từ 0 đến 30%'] },
    about: { type: String, default: DEFAULT_SETTINGS.about },
    facebook: { type: String, default: DEFAULT_SETTINGS.facebook, trim: true },
    zalo: { type: String, default: DEFAULT_SETTINGS.zalo, trim: true },
    policies: { type: String, default: DEFAULT_SETTINGS.policies },
  },
  { timestamps: true }
);

settingSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Setting', settingSchema);
