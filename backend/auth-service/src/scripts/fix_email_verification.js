import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function fixEmailVerification() {
  try {
    console.log('MongoDB bağlantısı kuruluyor...');
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB bağlantısı başarılı!');

    const db = mongoose.connection;
    const users = db.collection('users');

    // Email doğrulaması olmayan kullanıcıları bul
    const unverifiedUsers = await users.find({
      $or: [
        { isEmailVerified: false },
        { isEmailVerified: { $exists: false } },
        { emailVerifiedAt: null },
        { emailVerifiedAt: { $exists: false } }
      ]
    }).toArray();

    console.log(`Toplam ${unverifiedUsers.length} adet doğrulanmamış kullanıcı bulundu.`);

    if (unverifiedUsers.length === 0) {
      console.log('Doğrulanmamış kullanıcı bulunamadı.');
      return;
    }

    // Kullanıcıları listele
    console.log('\nDoğrulanmamış kullanıcılar:');
    unverifiedUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}, isEmailVerified: ${user.isEmailVerified}, emailVerifiedAt: ${user.emailVerifiedAt}`);
    });

    // Güncelleme tarihi
    const verificationDate = new Date('2025-07-14T14:54:27.713+00:00');

    // Kullanıcıları güncelle
    const updateResult = await users.updateMany(
      {
        $or: [
          { isEmailVerified: false },
          { isEmailVerified: { $exists: false } },
          { emailVerifiedAt: null },
          { emailVerifiedAt: { $exists: false } }
        ]
      },
      {
        $set: {
          isEmailVerified: true,
          emailVerifiedAt: verificationDate
        }
      }
    );

    console.log(`\n✅ Güncelleme tamamlandı!`);
    console.log(`📊 Güncellenen kullanıcı sayısı: ${updateResult.modifiedCount}`);
    console.log(`📅 Doğrulama tarihi: ${verificationDate.toISOString()}`);

    // Güncellenen kullanıcıları kontrol et
    const updatedUsers = await users.find({
      isEmailVerified: true,
      emailVerifiedAt: verificationDate
    }).toArray();

    console.log('\n✅ Güncellenen kullanıcılar:');
    updatedUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}, isEmailVerified: ${user.isEmailVerified}, emailVerifiedAt: ${user.emailVerifiedAt}`);
    });

  } catch (error) {
    console.error('❌ Hata oluştu:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB bağlantısı kapatıldı.');
  }
}

// Scripti çalıştır
fixEmailVerification().catch(err => {
  console.error('\n💥 Script hatası:', err);
  process.exit(1);
}); 