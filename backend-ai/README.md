## Setup (First Time)
 
### 1. Create virtual environment
 
```bash
cd backend-ai
python -m venv venv
venv\Scripts\activate        
```
 
### 2. Install dependencies
 
```bash
pip install -r requirements.txt
```
 
### 3. Create `.env` file
 
Create a file called `.env` inside `backend-ai/` with:
 
```
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```
 
### 4. Build the FAISS index
 
This runs once to embed all content and save the vector index to disk:
 
```bash
cd backend-ai/app/rag
python ingest.py
```
 
Expected output:
```
✅ Total chunks: 115
✅ FAISS index built with 115 vectors
✅ Index saved
✅ Chunks saved
Ingestion complete!
```
 
This generates two files: `app/data/index.faiss` and `app/data/chunks.json`.
 
**Re-run if data is updated.**
 
### 5. Start the server
 
```bash
cd backend-ai/app
uvicorn main:app --reload --port 8000
```
 
Expected output:
```
✅ FAISS index ready
INFO: Application startup complete.
INFO: Uvicorn running on http://127.0.0.1:8000
```
 
---
 
## Running the Full App
 
**Terminal 1 — AI Backend:**
```bash
cd backend-ai/app
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```
 
**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
 
Open `http://localhost:5173`, click **AI Mode** in the search bar.

## Owner
 
Shravani Pachkawade — AI Full Stack Intern, Vaahan International
Feature branch: `feature/ai-advisor`