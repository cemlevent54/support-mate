import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema(
    {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      googleId: { type: String, unique: true, sparse: true, default: null },
      isEmailVerified: { type: Boolean, default: false },
      emailVerifiedAt: { type: Date, default: null },
      phoneNumber: { type: String, default: null },
      password: { type: String, required: true },
      role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
      roleName: { type: String, default: null },
      isActive: { type: Boolean, default: true },
      isDeleted: { type: Boolean, default: false },
      deletedAt: { type: Date, default: null },
    },
    {
      timestamps: true, // createdAt & updatedAt otomatik
    }
);

UserSchema.pre('save', async function (next) {
    const user = this;
    if (!user.isModified('password')) return next();
  
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  });

UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
  
export const UserModel = mongoose.model('User', UserSchema); 