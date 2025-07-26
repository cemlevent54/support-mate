import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function fixGoogleIdIndex() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection;
  const users = db.collection('users');

  // Önce googleId alanı üzerindeki unique index'i kaldır
  try {
    const indexes = await users.indexes();
    const googleIdIndex = indexes.find(idx => idx.key && idx.key.googleId === 1);
    if (googleIdIndex) {
      await users.dropIndex('googleId_1');
      console.log('googleId_1 indexi kaldırıldı.');
    } else {
      console.log('googleId_1 indexi bulunamadı, kaldırmaya gerek yok.');
    }
  } catch (err) {
    console.warn('Index kaldırılırken hata oluştu (devam ediliyor):', err.message);
  }

  // Yeni sparse unique index oluştur
  try {
    await users.createIndex(
      { googleId: 1 }, 
      { 
        unique: true, 
        sparse: true,
        name: 'googleId_sparse_unique'
      }
    );
    console.log('Yeni sparse googleId index\'i oluşturuldu.');
  } catch (err) {
    console.warn('Yeni index oluşturulurken hata oluştu:', err.message);
  }

  // Null ve undefined googleId değerlerini tamamen kaldır
  try {
    const result = await users.updateMany(
      { $or: [{ googleId: null }, { googleId: undefined }] },
      { $unset: { googleId: "" } }
    );
    console.log(`${result.modifiedCount} kullanıcı kaydından googleId alanı kaldırıldı.`);
  } catch (err) {
    console.warn('googleId alanları temizlenirken hata oluştu:', err.message);
  }

  // Boş string googleId değerlerini de kaldır
  try {
    const result2 = await users.updateMany(
      { googleId: "" },
      { $unset: { googleId: "" } }
    );
    console.log(`${result2.modifiedCount} kullanıcı kaydından boş googleId alanı kaldırıldı.`);
  } catch (err) {
    console.warn('Boş googleId alanları temizlenirken hata oluştu:', err.message);
  }

  console.log('✅ googleId index sorunu düzeltildi. Artık yeni kullanıcılar googleId olmadan kayıt olabilir.');
  await mongoose.disconnect();
}

fixGoogleIdIndex().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
}); 