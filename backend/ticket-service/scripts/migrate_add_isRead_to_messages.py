import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient
from config.database import get_mongo_uri

def main():
    uri = get_mongo_uri()
    client = MongoClient(uri)
    db_name = uri.rsplit('/', 1)[-1].split('?')[0]
    db = client[db_name]
    messages = db["messages"]

    # Sadece isRead alanı olmayan dökümanları güncelle
    result = messages.update_many(
        {"isRead": {"$exists": False}},
        {"$set": {"isRead": True}}
    )
    print(f"Updated {result.modified_count} messages.")

if __name__ == "__main__":
    main()
