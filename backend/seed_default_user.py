"""
Quick database seeding script - creates a default superadmin user
"""

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
import asyncio
import uuid
from datetime import datetime, timezone

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def seed_default_user():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print(f"Connected to database: {db_name}")

    # Default user details
    mobile = "0719598859"  # Your mobile from the curl request
    name = "Super Admin"

    # Check if user already exists
    existing = await db.users.find_one({"mobile": mobile})
    if existing:
        print(f"[OK] User with mobile {mobile} already exists!")
        print(f"   Name: {existing['name']}")
        print(f"   Role: {existing['role']}")
        print(f"\n[INFO] You can now send OTP to this number")
    else:
        # Create Super Admin
        superadmin_user = {
            "id": str(uuid.uuid4()),
            "mobile": mobile,
            "name": name,
            "role": "super_admin",
            "company_id": None,
            "employee_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None
        }

        await db.users.insert_one(superadmin_user)
        print(f"[SUCCESS] Super Admin created successfully!")
        print(f"   Name: {name}")
        print(f"   Mobile: {mobile}")
        print(f"   Role: superadmin")
        print(f"\n[INFO] You can now send OTP to {mobile}")

    print("\n" + "="*60)
    print("Next steps:")
    print("="*60)
    print(f"1. Send OTP: POST http://127.0.0.1:8000/api/auth/send-otp")
    print(f'   Body: {{"mobile": "{mobile}"}}')
    print(f"\n2. Check console/SMS for OTP code")
    print(f"\n3. Verify OTP: POST http://127.0.0.1:8000/api/auth/verify-otp")
    print(f'   Body: {{"mobile": "{mobile}", "otp": "YOUR_OTP_CODE"}}')

    # Close connection
    client.close()

if __name__ == "__main__":
    print("="*60)
    print("CREATING DEFAULT SUPER ADMIN USER")
    print("="*60)
    asyncio.run(seed_default_user())
