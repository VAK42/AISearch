```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
.\venv\Scripts\uvicorn.exe main:app --reload --port 8000

cd frontend
npm install
npm run dev
```