import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Virtual field for users with this role
roleSchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'role'
});

// Index'ler
roleSchema.index({ name: 1 });
roleSchema.index({ isDeleted: 1 });
roleSchema.index({ isActive: 1 });

export const RoleModel = mongoose.model('Role', roleSchema); 