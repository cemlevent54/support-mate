import pymongo
from datetime import datetime, timedelta
from bson.objectid import ObjectId

# migrate_mongodb_data.py ile uyumlu bağlantı
MONGO_URI = "mongodb://root:password@localhost:27017/ticket-service?authSource=admin"
DB_NAME = "ticket-service"
COLLECTION_NAME = "messages"

client = pymongo.MongoClient(MONGO_URI)
db = client[DB_NAME]
table = db[COLLECTION_NAME]

count = 0
for msg in table.find({ "timestamp": { "$exists": True } }):
    old_ts = msg["timestamp"]
    # ISO string veya datetime olabilir
    if isinstance(old_ts, dict) and "$date" in old_ts:
        old_ts = old_ts["$date"]
    if isinstance(old_ts, str):
        old_ts = datetime.fromisoformat(old_ts.replace("Z", "+00:00"))
    elif isinstance(old_ts, datetime):
        pass
    else:
        print(f"Geçersiz timestamp: {msg['_id']}")
        continue
    # UTC+3'e çevir
    new_ts = old_ts + timedelta(hours=3)
    table.update_one(
        { "_id": msg["_id"] },
        { "$set": { "timestamp": new_ts } }
    )
    print(f"{msg['_id']} güncellendi: {old_ts} -> {new_ts}")
    count += 1
print(f"Toplam {count} mesaj güncellendi. Tüm timestamp'ler TR saatine çevrildi.") 