# Selective Extraction

This workspace contains a minimal React frontend (Vite) and a Flask backend.

## Features

- 📄 **Document Support**: Upload and process PDF, DOCX, and TXT files
- 🎯 **Smart Extraction**: Define custom extraction rules to find specific data
- 🎨 **Visual Highlighting**: Color-coded highlights for different extraction types
- ⚡ **Real-time Processing**: Fast AI-powered extraction using Groq
- 🌊 **Modern UI**: Beautiful animated interface with wave effects

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Flask (Python)
- **AI**: Groq API for text extraction
- **Styling**: Custom CSS with glassmorphism effects

## Prerequisites

- Node.js (v16+)
- Python 3.8+
- Groq API Key ([Get one here](https://console.groq.com/))

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd selectiveExtraction
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env

# Edit .env and add your Groq API key
# GROQ_API_KEY=your_actual_api_key_here

# Run the backend server
python app.py
```

The backend will run on `http://127.0.0.1:5001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:3000` (or next available port)

## Usage

1. **Upload a Document**: Click the upload area and select a PDF, DOCX, or TXT file
2. **Define Extraction Rules**: Add rules describing what to extract (e.g., "Dates", "Names", "Email addresses")
3. **Choose Colors**: Select colors for each extraction rule
4. **Extract**: Click "Extract Highlights" to process the document
5. **View Results**: See highlighted text in the preview area

## Project Structure

```
selectiveExtraction/
├── backend/
│   ├── app.py              # Flask backend server
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment variables template
│   └── venv/               # Virtual environment (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── components/     # React components
│   │   └── index.css       # Global styles
│   ├── package.json        # Node dependencies
│   └── vite.config.js      # Vite configuration
└── README.md
```

## API Endpoints

- `GET /api/hello` - Health check endpoint
- `POST /api/highlight` - Extract highlights from document content

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

## Development

### Backend
- Runs on port `5001` by default
- Debug mode enabled for development

### Frontend
- Hot module replacement enabled
- Vite dev server with fast refresh

Notes & next steps
------------------
- The backend imports `flask` and `flask_cors`; ensure you run the `pip install -r requirements.txt` step.
- If you'd like to run both servers together in a single command, consider using a task runner or `concurrently` (Node) for the frontend and `wait-on` for port readiness — I can add that if you'd like.

If you want, I can also:
- Add a small Docker Compose setup to run both services in containers.
- Add a simple integration test or a Postman collection.

Enjoy! If you want the frontend wired to a specific API base URL or environment variables, tell me and I'll add an `.env` and examples.

