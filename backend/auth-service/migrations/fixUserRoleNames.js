// migration/fixUserRoleNames.js
import mongoose from 'mongoose';
import { UserModel } from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const ADMIN_ROLE_ID = '686f92a851b4a9e31a973c88';
const ADMIN_ROLE_NAME = 'Admin';
const TARGET_EMAIL = 'cemlevent54@gmail.com';

async function migrate() {
  await mongoose.connect(MONGO_URI);
  const user = await UserModel.findOne({ email: TARGET_EMAIL });
  if (user) {
    let updated = false;
    if (user.roleName !== ADMIN_ROLE_NAME) {
      user.roleName = ADMIN_ROLE_NAME;
      updated = true;
    }
    if (!user.role || user.role.toString() !== ADMIN_ROLE_ID) {
      user.role = ADMIN_ROLE_ID;
      updated = true;
    }
    if (updated) {
      await user.save();
      console.log(`Updated user ${user.email} with roleName: ${ADMIN_ROLE_NAME} and role: ${ADMIN_ROLE_ID}`);
    } else {
      console.log(`No update needed for user ${user.email}`);
    }
  } else {
    console.log(`User with email ${TARGET_EMAIL} not found.`);
  }
  console.log('Migration finished');
  process.exit();
}

migrate();