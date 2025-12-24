"""
Fix superadmin role - update from "superadmin" to "super_admin"
"""

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
import asyncio

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def fix_role():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print("=" * 60)
    print("FIXING SUPER ADMIN ROLE")
    print("=" * 60)

    # Find users with incorrect role
    result = await db.users.update_many(
        {"role": "superadmin"},
        {"$set": {"role": "super_admin"}}
    )

    print(f"\n[INFO] Updated {result.modified_count} user(s)")

    # Show all superadmin users
    users = await db.users.find({"role": "super_admin"}, {"_id": 0}).to_list(100)

    if users:
        print("\n[SUCCESS] Super admin users:")
        for user in users:
            print(f"   - Name: {user['name']}, Mobile: {user['mobile']}, Role: {user['role']}")
    else:
        print("\n[WARNING] No super_admin users found!")

    client.close()
    print("\n[DONE] Role fix completed!")

if __name__ == "__main__":
    asyncio.run(fix_role())
