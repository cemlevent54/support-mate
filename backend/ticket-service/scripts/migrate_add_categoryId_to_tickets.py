import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient
from config.database import get_mongo_uri

CATEGORY_ID = "687e14b352d20de763bea706"

def main():
    uri = get_mongo_uri()
    client = MongoClient(uri)
    db_name = uri.rsplit('/', 1)[-1].split('?')[0]
    db = client[db_name]
    tickets = db["tickets"]

    result = tickets.update_many(
        {"categoryId": {"$exists": False}},
        {"$set": {"categoryId": CATEGORY_ID}}
    )
    print(f"Updated {result.modified_count} tickets.")

if __name__ == "__main__":
    main() 