import asyncio
import websockets
import sys

async def test_conn():
    uri = "wss://vaahan-international-1-kv8e.onrender.com/api/v1/auth/ws/trip/072096a5-a993-4b49-aeaa-a4f0e219f34c/listen"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Successfully connected!")
            # Wait for 3 seconds
            await asyncio.sleep(3)
            print("Closing connection.")
    except Exception as e:
        print(f"Connection failed: {str(e)}")

async def main():
    await test_conn()

if __name__ == "__main__":
    asyncio.run(main())
