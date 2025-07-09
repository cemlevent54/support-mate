# MongoDB Yönetimi

Bu klasör MongoDB veritabanı yönetimi için ayrılmıştır.

## Özellikler

- **Kalıcı Veri Saklama**: `./data` klasöründe veriler kalıcı olarak saklanır
- **MongoDB Express**: Web tabanlı admin arayüzü (http://localhost:5000)
- **Otomatik Başlatma**: Container yeniden başlatıldığında veriler korunur

## Kullanım

### Başlatma
```bash
cd mongodb
docker-compose up -d
```

### Durdurma
```bash
docker-compose down
```

### Verileri Koruyarak Durdurma
```bash
docker-compose down
```

### Tamamen Silme (Veriler Dahil)
```bash
docker-compose down -v
rm -rf data/
```

## Erişim Bilgileri

- **MongoDB**: localhost:27017
- **MongoDB Express**: http://localhost:5000
  - Kullanıcı: admin
  - Şifre: admin123

## Veri Yedekleme

### Yedekleme
```bash
docker exec mongodb_auth_service mongodump --out /data/backup
docker cp mongodb_auth_service:/data/backup ./backup
```

### Geri Yükleme
```bash
docker cp ./backup mongodb_auth_service:/data/
docker exec mongodb_auth_service mongorestore /data/backup
```

## Klasör Yapısı

```
mongodb/
├── docker-compose.yml
├── README.md
├── data/           # MongoDB veri dosyaları
└── init/           # Başlangıç scriptleri (opsional)
``` 