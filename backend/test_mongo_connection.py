import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

async def test_connection():
    try:
        # Get connection details
        mongo_url = os.environ['MONGO_URL']
        db_name = os.environ['DB_NAME']

        print(f"Attempting to connect to: {mongo_url.replace(mongo_url.split('@')[0].split('//')[1], '***:***')}")
        print(f"Database name: {db_name}")
        print("-" * 50)

        # Create client
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)

        # Test connection
        await client.admin.command('ping')
        print("✓ MongoDB connection successful!")

        # Get database
        db = client[db_name]

        # List collections
        collections = await db.list_collection_names()
        print(f"\n✓ Connected to database: {db_name}")
        print(f"✓ Number of collections: {len(collections)}")

        if collections:
            print(f"✓ Collections found: {', '.join(collections)}")
        else:
            print("! No collections found (database might be empty)")

        client.close()
        return True

    except Exception as e:
        print(f"✗ Connection failed!")
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    asyncio.run(test_connection())
