#!/usr/bin/env python3
"""
Migration script to rename createdByCustomerSupporterId to createdBy in tasks collection
"""

import sys
import os
from datetime import datetime

# Add the parent directory to the path so we can import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import get_mongo_uri
from pymongo import MongoClient
from bson import ObjectId

def migrate_task_createdBy_field():
    """
    Migrate createdByCustomerSupporterId field to createdBy in tasks collection
    """
    try:
        # Connect to MongoDB
        uri = get_mongo_uri()
        client = MongoClient(uri)
        db_name = uri.rsplit('/', 1)[-1].split('?')[0]
        db = client[db_name]
        tasks_collection = db["tasks"]
        
        print(f"[{datetime.now()}] Starting migration: createdByCustomerSupporterId -> createdBy")
        print(f"[{datetime.now()}] Database: {db_name}")
        print(f"[{datetime.now()}] Collection: tasks")
        
        # Find all tasks that have createdByCustomerSupporterId field
        tasks_with_old_field = tasks_collection.find({"createdByCustomerSupporterId": {"$exists": True}})
        tasks_list = list(tasks_with_old_field)
        
        print(f"[{datetime.now()}] Found {len(tasks_list)} tasks with createdByCustomerSupporterId field")
        
        if len(tasks_list) == 0:
            print(f"[{datetime.now()}] No tasks found with createdByCustomerSupporterId field. Migration completed.")
            return
        
        # Update each task
        updated_count = 0
        for task in tasks_list:
            task_id = task.get("_id")
            old_value = task.get("createdByCustomerSupporterId")
            
            print(f"[{datetime.now()}] Processing task {task_id}: createdByCustomerSupporterId = {old_value}")
            
            # Update the document
            result = tasks_collection.update_one(
                {"_id": task_id},
                {
                    "$set": {"createdBy": old_value},
                    "$unset": {"createdByCustomerSupporterId": ""}
                }
            )
            
            if result.modified_count > 0:
                updated_count += 1
                print(f"[{datetime.now()}] ✅ Successfully updated task {task_id}")
            else:
                print(f"[{datetime.now()}] ❌ Failed to update task {task_id}")
        
        print(f"[{datetime.now()}] Migration completed!")
        print(f"[{datetime.now()}] Total tasks processed: {len(tasks_list)}")
        print(f"[{datetime.now()}] Successfully updated: {updated_count}")
        print(f"[{datetime.now()}] Failed updates: {len(tasks_list) - updated_count}")
        
        # Verify the migration
        print(f"[{datetime.now()}] Verifying migration...")
        
        # Check if any tasks still have the old field
        remaining_old_field = tasks_collection.count_documents({"createdByCustomerSupporterId": {"$exists": True}})
        print(f"[{datetime.now()}] Tasks still with createdByCustomerSupporterId: {remaining_old_field}")
        
        # Check how many tasks now have the new field
        tasks_with_new_field = tasks_collection.count_documents({"createdBy": {"$exists": True}})
        print(f"[{datetime.now()}] Tasks with createdBy field: {tasks_with_new_field}")
        
        if remaining_old_field == 0:
            print(f"[{datetime.now()}] ✅ Migration verification successful!")
        else:
            print(f"[{datetime.now()}] ⚠️  Warning: Some tasks still have the old field")
        
    except Exception as e:
        print(f"[{datetime.now()}] ❌ Migration failed with error: {str(e)}")
        raise
    finally:
        if 'client' in locals():
            client.close()

def rollback_migration():
    """
    Rollback migration: rename createdBy back to createdByCustomerSupporterId
    """
    try:
        # Connect to MongoDB
        uri = get_mongo_uri()
        client = MongoClient(uri)
        db_name = uri.rsplit('/', 1)[-1].split('?')[0]
        db = client[db_name]
        tasks_collection = db["tasks"]
        
        print(f"[{datetime.now()}] Starting rollback: createdBy -> createdByCustomerSupporterId")
        
        # Find all tasks that have createdBy field
        tasks_with_new_field = tasks_collection.find({"createdBy": {"$exists": True}})
        tasks_list = list(tasks_with_new_field)
        
        print(f"[{datetime.now()}] Found {len(tasks_list)} tasks with createdBy field")
        
        if len(tasks_list) == 0:
            print(f"[{datetime.now()}] No tasks found with createdBy field. Rollback completed.")
            return
        
        # Update each task
        updated_count = 0
        for task in tasks_list:
            task_id = task.get("_id")
            new_value = task.get("createdBy")
            
            print(f"[{datetime.now()}] Processing task {task_id}: createdBy = {new_value}")
            
            # Update the document
            result = tasks_collection.update_one(
                {"_id": task_id},
                {
                    "$set": {"createdByCustomerSupporterId": new_value},
                    "$unset": {"createdBy": ""}
                }
            )
            
            if result.modified_count > 0:
                updated_count += 1
                print(f"[{datetime.now()}] ✅ Successfully rolled back task {task_id}")
            else:
                print(f"[{datetime.now()}] ❌ Failed to rollback task {task_id}")
        
        print(f"[{datetime.now()}] Rollback completed!")
        print(f"[{datetime.now()}] Total tasks processed: {len(tasks_list)}")
        print(f"[{datetime.now()}] Successfully rolled back: {updated_count}")
        
    except Exception as e:
        print(f"[{datetime.now()}] ❌ Rollback failed with error: {str(e)}")
        raise
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Migrate task createdBy field')
    parser.add_argument('--rollback', action='store_true', help='Rollback the migration')
    
    args = parser.parse_args()
    
    if args.rollback:
        print("Rolling back migration...")
        rollback_migration()
    else:
        print("Running migration...")
        migrate_task_createdBy_field() 