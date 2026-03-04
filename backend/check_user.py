import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import sys

load_dotenv()

async def check_user(mobile=None):
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]

    if mobile:
        # Search for specific mobile
        user = await db.users.find_one({"office_mobile": mobile})
        if user:
            print(f"✓ User found: {user.get('name')} | office_mobile: {user.get('office_mobile')} | role: {user.get('role')}")
        else:
            print(f"✗ No user with office_mobile='{mobile}'")
            # Try partial match
            print("\nSearching for similar mobile numbers...")
            async for u in db.users.find({"office_mobile": {"$regex": mobile[-7:]}}):
                print(f"  Similar: {u.get('name')} | office_mobile: '{u.get('office_mobile')}'")
    else:
        # Show all users' mobile numbers
        print("All users (name | office_mobile | role):")
        async for u in db.users.find({}, {"name": 1, "office_mobile": 1, "role": 1, "_id": 0}):
            print(f"  {u.get('name')} | '{u.get('office_mobile')}' | {u.get('role')}")

    client.close()

if __name__ == "__main__":
    mobile = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(check_user(mobile))