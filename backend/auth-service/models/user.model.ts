import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    isEmailVerified: boolean;
    emailVerifiedAt?: Date;
    phoneNumber?: string;
    password: string;
    role: string;
    isActive: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema<IUser>(
    {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      isEmailVerified: { type: Boolean, default: false },
      emailVerifiedAt: { type: Date, default: null },
      phoneNumber: { type: String, default: null },
      password: { type: String, required: true },
      role: { type: String, default: 'user' },
      isActive: { type: Boolean, default: true },
      isDeleted: { type: Boolean, default: false },
      deletedAt: { type: Date, default: null },
    },
    {
      timestamps: true, // createdAt & updatedAt otomatik
    }
);

UserSchema.pre('save', async function (next) {
    const user = this as IUser;
    if (!user.isModified('password')) return next();
  
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  });

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};
  
export const UserModel = mongoose.model<IUser>('User', UserSchema);

