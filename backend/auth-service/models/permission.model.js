import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    default: 'general'
  },
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

// Index'ler
permissionSchema.index({ code: 1 });
permissionSchema.index({ category: 1 });
permissionSchema.index({ isDeleted: 1 });
permissionSchema.index({ isActive: 1 });

export const PermissionModel = mongoose.model('Permission', permissionSchema); 