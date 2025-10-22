# TextSelecter - Starter Frontend + Backend

This workspace contains a minimal React frontend (Vite) and a Flask backend.

Overview
--------
- Frontend: Vite + React app at `frontend/` (dev server on port 3000)
- Backend: Flask app at `backend/` (dev server on port 5000)

The frontend makes a request to `http://127.0.0.1:5000/api/hello` by default. CORS is enabled on the backend for development.

Quick start (Windows PowerShell)
--------------------------------

Open two PowerShell windows or two terminals in VS Code.

1) Frontend

```
# from repository root
cd .\frontend
npm install
npm run dev
```

This starts the Vite dev server (default port 3000). If your browser doesn't open automatically, visit http://localhost:3000

2) Backend

```
# from repository root
cd .\backend
# create a virtual environment (recommended)
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

The Flask app runs on port 5000 by default. If PowerShell prevents activation due to an ExecutionPolicy, run PowerShell as Administrator and allow scripts, or use `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.

Test the backend (PowerShell / curl)

```
curl http://127.0.0.1:5000/api/hello
```

What was created
----------------
- `frontend/` - Vite + React starter with a small page that fetches `/api/hello`.
- `backend/` - Flask app with one endpoint: `/api/hello`.
- Root `README.md` - this file with run instructions.

Notes & next steps
------------------
- The backend imports `flask` and `flask_cors`; ensure you run the `pip install -r requirements.txt` step.
- If you'd like to run both servers together in a single command, consider using a task runner or `concurrently` (Node) for the frontend and `wait-on` for port readiness — I can add that if you'd like.

If you want, I can also:
- Add a small Docker Compose setup to run both services in containers.
- Add a simple integration test or a Postman collection.

Enjoy! If you want the frontend wired to a specific API base URL or environment variables, tell me and I'll add an `.env` and examples.

