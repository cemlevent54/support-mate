import mongoose from 'mongoose';
import { PermissionModel } from '../models/permission.model.js';
import { ROLE_PERMISSIONS } from '../services/role.service.js';
import { USER_PERMISSIONS } from '../services/user.service.js';
import { AUTH_PERMISSIONS } from '../services/auth.service.js';
import { PERMISSION_PERMISSIONS } from '../services/permission.service.js';
import translation from '../config/translation.js';

export async function seedPermissions(locale = 'tr') {
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
      console.log(translation('migrations.logs.added', locale, { code: perm.code }));
    } else {
      // Update can be done here, for now just skip if exists
      // await PermissionModel.updateOne({ code: perm.code }, perm);
      console.log(translation('migrations.logs.alreadyExists', locale, { code: perm.code }));
    }
  }
  console.log(translation('migrations.logs.allMigrated', locale));
} 