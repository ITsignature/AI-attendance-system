"""
Database seeding script to create initial users for the ERP system
Run this script to add a superadmin and/or company admin to get started
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

async def seed_database():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print(f"Connected to database: {db_name}")

    # Check if users already exist
    existing_users = await db.users.count_documents({})
    print(f"Existing users in database: {existing_users}")

    if existing_users > 0:
        response = input("Users already exist. Do you want to add more users? (y/n): ")
        if response.lower() != 'y':
            print("Seeding cancelled.")
            client.close()
            return

    # Ask what type of user to create
    print("\nWhat type of user would you like to create?")
    print("1. Super Admin (full system access)")
    print("2. Company Admin (company management)")
    print("3. Both")

    choice = input("Enter your choice (1/2/3): ")

    users_created = []

    # Create Super Admin
    if choice in ['1', '3']:
        print("\n--- Creating Super Admin ---")
        name = input("Enter super admin name (default: Super Admin): ") or "Super Admin"
        mobile = input("Enter mobile number (10 digits, default: 0719598859): ") or "0719598859"

        superadmin_user = {
            "id": str(uuid.uuid4()),
            "mobile": mobile,
            "name": name,
            "role": "superadmin",
            "company_id": None,
            "employee_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None
        }

        # Check if user with this mobile already exists
        existing = await db.users.find_one({"mobile": mobile, "role": "superadmin"})
        if existing:
            print(f"❌ Super admin with mobile {mobile} already exists!")
        else:
            await db.users.insert_one(superadmin_user)
            users_created.append(f"Super Admin: {name} ({mobile})")
            print(f"✅ Super admin created: {name} ({mobile})")

    # Create Company Admin
    if choice in ['2', '3']:
        print("\n--- Creating Company and Admin ---")
        company_name = input("Enter company name (default: Test Company): ") or "Test Company"
        admin_name = input("Enter admin name (default: Company Admin): ") or "Company Admin"
        admin_mobile = input("Enter admin mobile (10 digits, default: 0771234567): ") or "0771234567"
        admin_email = input("Enter admin email (optional): ") or None

        # Create company
        company_id = str(uuid.uuid4())
        company = {
            "id": company_id,
            "name": company_name,
            "admin_name": admin_name,
            "admin_mobile": admin_mobile,
            "email": admin_email,
            "address": None,
            "contact_number": None,
            "status": "active",  # Set to active so they can log in
            "sms_gateway": "textit",
            "sms_enabled": False,
            "sms_username": None,
            "sms_password": None,
            "company_info_completed": False,
            "invoicing_enabled": True,
            "location_tracking_enabled": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None
        }

        # Check if company already exists
        existing_company = await db.companies.find_one({"name": company_name})
        if existing_company:
            print(f"⚠️  Company '{company_name}' already exists, using existing company")
            company_id = existing_company["id"]
        else:
            await db.companies.insert_one(company)
            print(f"✅ Company created: {company_name}")

        # Create admin user
        admin_user = {
            "id": str(uuid.uuid4()),
            "company_id": company_id,
            "employee_id": None,
            "mobile": admin_mobile,
            "name": admin_name,
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None
        }

        # Check if user with this mobile already exists
        existing_user = await db.users.find_one({"mobile": admin_mobile, "company_id": company_id})
        if existing_user:
            print(f"❌ Admin with mobile {admin_mobile} already exists for this company!")
        else:
            await db.users.insert_one(admin_user)
            users_created.append(f"Company Admin: {admin_name} ({admin_mobile}) - Company: {company_name}")
            print(f"✅ Admin user created: {admin_name} ({admin_mobile})")

    # Summary
    print("\n" + "="*60)
    print("DATABASE SEEDING COMPLETED!")
    print("="*60)
    if users_created:
        print("\n✅ Users created:")
        for user in users_created:
            print(f"   - {user}")
        print("\n📱 You can now log in using the mobile numbers above")
        print("   1. Send OTP: POST /api/auth/send-otp")
        print("   2. Verify OTP: POST /api/auth/verify-otp")
    else:
        print("\n⚠️  No new users were created")

    # Close connection
    client.close()
    print("\nDatabase connection closed.")

if __name__ == "__main__":
    print("="*60)
    print("ERP SYSTEM - DATABASE SEEDING SCRIPT")
    print("="*60)
    asyncio.run(seed_database())
