"""
Migration: Rename 'mobile' -> 'office_mobile' for all existing users.
Personal mobile is left empty (None) since we don't have that data.

Run once:
    cd backend
    python migrate_mobile_fields.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']


async def migrate():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # Count users that still have 'mobile' but no 'office_mobile'
    total = await db.users.count_documents({"mobile": {"$exists": True}, "office_mobile": {"$exists": False}})
    print(f"Found {total} user(s) to migrate.")

    if total == 0:
        print("Nothing to migrate.")
        client.close()
        return

    # Rename 'mobile' -> 'office_mobile' for all affected documents
    result = await db.users.update_many(
        {"mobile": {"$exists": True}, "office_mobile": {"$exists": False}},
        [{"$set": {"office_mobile": "$mobile"}}, {"$unset": "mobile"}]
    )

    print(f"Migrated {result.modified_count} user(s): 'mobile' renamed to 'office_mobile'.")
    client.close()


if __name__ == "__main__":
    asyncio.run(migrate())
