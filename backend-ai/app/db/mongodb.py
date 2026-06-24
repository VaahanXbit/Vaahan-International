from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

client = MongoClient(os.getenv("MONGODB_URI"))

db = client["vaahan_auth"]

articles_collection = db["articles"]
chunks_collection = db["ai_chunks"]
cache_collection = db["ai_cache"]