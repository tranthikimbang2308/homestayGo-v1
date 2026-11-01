import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['customer', 'owner', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Vui lòng nhập họ tên'], trim: true },
    email: {
      type: String,
      required: [true, 'Vui lòng nhập email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    password: { type: String, required: [true, 'Vui lòng nhập mật khẩu'], minlength: [6, 'Mật khẩu tối thiểu 6 ký tự'], select: false },
    phone: { type: String, trim: true, default: '' },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ROLES, default: 'customer' },
    isActive: { type: Boolean, default: true },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
    bio: { type: String, default: '' },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function matchPassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
