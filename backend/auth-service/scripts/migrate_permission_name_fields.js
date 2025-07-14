import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function migratePermissionNames() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection;
  const permissions = db.collection('permissions');

  // Önce name alanı üzerindeki unique index'i kaldır
  try {
    const indexes = await permissions.indexes();
    const nameIndex = indexes.find(idx => idx.key && idx.key.name === 1);
    if (nameIndex) {
      await permissions.dropIndex('name_1');
      console.log('name_1 indexi kaldırıldı.');
    } else {
      console.log('name_1 indexi bulunamadı, kaldırmaya gerek yok.');
    }
  } catch (err) {
    console.warn('Index kaldırılırken hata oluştu (devam ediliyor):', err.message);
  }

  // Migration işlemi
  const cursor = permissions.find({});
  let updatedCount = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const update = {
      $set: {
        name_tr: doc.name || '',
        name_en: ''
      },
      $unset: {
        name: '',
        description: '',
        description_tr: '',
        description_en: ''
      }
    };
    await permissions.updateOne({ _id: doc._id }, update);
    updatedCount++;
  }

  console.log(`${updatedCount} permission dokümanı güncellendi.`);
  await mongoose.disconnect();
}

migratePermissionNames().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
}); 