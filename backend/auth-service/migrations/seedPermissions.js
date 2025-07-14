import mongoose from 'mongoose';
import { PermissionModel } from '../models/permission.model.js';
import { ROLE_PERMISSIONS } from '../services/role.service.js';
import { USER_PERMISSIONS } from '../services/user.service.js';
import { AUTH_PERMISSIONS } from '../services/auth.service.js';
import { PERMISSION_PERMISSIONS } from '../services/permission.service.js';

export async function seedPermissions() {
  const allPermissions = [
    ...ROLE_PERMISSIONS,
    ...USER_PERMISSIONS,
    ...AUTH_PERMISSIONS,
    ...PERMISSION_PERMISSIONS
  ];

  for (const perm of allPermissions) {
    if (!perm.code) continue;
    const exists = await PermissionModel.findOne({ code: perm.code });
    if (!exists) {
      await PermissionModel.create(perm);
      console.log(`[Permission Migration] Added: ${perm.code}`);
    } else {
      // Update can be done here, for now just skip if exists
      // await PermissionModel.updateOne({ code: perm.code }, perm);
      console.log(`[Permission Migration] Already exists: ${perm.code}`);
    }
  }
  console.log('[Permission Migration] All static permissions migrated.');
} 