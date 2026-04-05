# 🧠 AI Resume Builder

A full-stack AI-powered resume platform that helps job seekers create professional resumes, analyze job fit, practice mock interviews, track applications, and generate cover letters — all in one place.

---

## ✨ Features

- **📄 Resume Builder** — Build and customize professional resumes with a live editor
- **🔍 Resume Analyzer** — Upload your resume and a job description to get an AI-powered match score, keyword analysis, and improvement suggestions
- **🤖 Mock Interviewer** — Practice AI-generated interview questions tailored to your resume and role, with evaluated feedback on your answers
- **📬 Cover Letter Generator** — Auto-generate personalized cover letters based on your resume and target job
- **📊 Job Tracker** — Track your job applications with status updates in one dashboard
- **🏆 Leaderboard** — Community leaderboard to keep you motivated
- **👤 Public Profile** — Share your profile with recruiters via a public link
- **🔐 Authentication** — Secure JWT-based login and registration

---

## 🏗️ Architecture

The project is organized as a **monorepo** with three independent services:

```
AI-Resume-Builder/
├── frontend/        # React 19 SPA (Tailwind CSS, Framer Motion)
├── backend/         # Node.js REST API (Express, MongoDB)
├── ai-engine/       # Python AI Service (FastAPI, Groq LLaMA, spaCy)
├── render.yaml      # One-click deployment to Render
└── run.bat          # Local startup script (Windows)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, React Router v7, Tailwind CSS, Framer Motion, Recharts, jsPDF |
| **Backend** | Node.js, Express, MongoDB, JWT Auth, Cloudinary |
| **AI Engine** | Python, FastAPI, Groq API (LLaMA 3.3 70B), spaCy NLP, Google Generative AI |
| **Deployment** | Render (backend + AI engine), Vercel (frontend) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Python 3.10+
- MongoDB Atlas URI (or local MongoDB)
- [Groq API Key](https://console.groq.com/) (free)
- [Google Gemini API Key](https://aistudio.google.com/) (optional)
- Cloudinary account (for resume uploads)

---

### 1. Clone the Repository

```bash
git clone https://github.com/satyamkumar68/AI-Resume-Builder.git
cd AI-Resume-Builder
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
PYTHON_API_URL=http://localhost:8000
API_KEY=your_shared_secret_key_between_backend_and_ai_engine
```

Start the backend:

```bash
node server.js
```

The backend runs at `http://localhost:5000`

---

### 3. AI Engine Setup

```bash
cd ai-engine
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

Create a `.env` file in the `ai-engine/` directory:

```env
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
API_KEY=your_shared_secret_key_between_backend_and_ai_engine
```

> ⚠️ The `API_KEY` must match the one set in the backend `.env`.

Start the AI engine:

```bash
uvicorn main:app --reload --port 8000
```

The AI engine runs at `http://localhost:8000`

---

### 4. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
REACT_APP_NODE_API_URL=http://localhost:5000/api
REACT_APP_PYTHON_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm start
```

The app runs at `http://localhost:3000`

---

## ☁️ Deployment

This project includes a `render.yaml` for **one-click deployment** to [Render](https://render.com).

### Services deployed:
- `ai-resume-backend` — Node.js API on Render
- `ai-resume-nlp` — Python AI Engine via Docker on Render
- `ai-resume-frontend` — Static React build on Render (or Vercel recommended)

### Deploy to Render:

1. Fork this repository
2. Go to [render.com](https://render.com) → **New** → **Blueprint**
3. Connect your forked repo
4. Add the required environment variables (marked `sync: false` in `render.yaml`)
5. Deploy 🚀

### Deploy Frontend to Vercel (recommended):

```bash
cd frontend
npx vercel --prod
```

Set the environment variables in Vercel dashboard:
```
REACT_APP_NODE_API_URL=https://ai-resume-backend.onrender.com/api
REACT_APP_PYTHON_API_URL=https://ai-resume-nlp.onrender.com
```

---

## 📡 API Overview

### Backend (Node.js — `/api`)

| Route | Description |
|---|---|
| `POST /api/auth/register` | Register a new user |
| `POST /api/auth/login` | Login and receive JWT |
| `GET/POST /api/resume` | Create and fetch resumes |
| `GET/POST /api/jobs` | Job application tracking |
| `GET /api/leaderboard` | Community leaderboard |
| `GET /api/analytics` | User analytics |
| `GET /api/public/:username` | Public user profile |

### AI Engine (FastAPI — port `8000`)

| Route | Description |
|---|---|
| `POST /analyze` | Resume vs JD match analysis & keyword extraction |
| `POST /interview/generate` | Generate interview questions from resume |
| `POST /interview/evaluate` | Evaluate a user's interview answer |

---

## 🗄️ Database Models

- **User** — Authentication, profile, public link
- **Resume** — Resume content and metadata
- **JobApplication** — Job tracking with status
- **Interview** — Mock interview sessions and scores

---

## 📁 Project Structure

```
frontend/src/
├── pages/
│   ├── Dashboard.jsx
│   ├── ResumeBuilder.jsx
│   ├── ResumeAnalyzer.jsx
│   ├── MockInterview.jsx
│   ├── CoverLetter.jsx
│   ├── JobTracker.jsx
│   ├── Leaderboard.jsx
│   ├── Profile.jsx
│   ├── PublicProfile.jsx
│   ├── Login.jsx
│   └── Register.jsx
├── components/
│   └── PageTransition.jsx
├── context/
└── App.jsx

backend/
├── controllers/
├── middleware/
├── models/
├── routes/
├── utils/
└── server.js

ai-engine/
├── core/
│   ├── analyzer.py      # Resume-JD match & keyword extraction
│   └── interviewer.py   # Interview question generation & evaluation
├── utils/
│   └── pdf_extractor.py
└── main.py              # FastAPI app entry point
```

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Satyam Kumar**
- GitHub: [@satyamkumar68](https://github.com/satyamkumar68)
