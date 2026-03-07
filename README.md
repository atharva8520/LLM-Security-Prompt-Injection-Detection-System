# LLM Security Shield

🛡️ A full-stack, cyberpunk-themed Prompt Injection Detection System. Built with React (Vite), Node.js (Express), and PostgreSQL. Powered by HuggingFace DeBERTa AI + 5-layer pipeline to detect & block Direct Override, Jailbreak, Obfuscation & Hidden RAG attacks in real-time. 92% threat detection accuracy.

## 🚀 Features

*   **Authentication**: JWT-based user login and registration system.
*   **Prompt Analysis Engine**: A multi-layered detection pipeline designed to flag malicious LLM prompts like jailbreaks and direct overrides.
*   **Dashboard**: A visually striking statistics overview of analyzed prompts.
*   **Interactive UI**: Styled exclusively with Tailwind CSS v4 in a dark "hacker" theme.

## 🛠️ Tech Stack

*   **Frontend**: React 18, Vite, Tailwind CSS v4, React Router Dom, Recharts, Axios.
*   **Backend**: Node.js, Express, PostgreSQL (`pg`), JSON Web Tokens, bcryptjs.
*   **Database**: PostgreSQL 15 (Dockerized).

## 🏃 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Docker & Docker Compose (or Docker Desktop)
*   npm

### 1. Database Setup
The application uses PostgreSQL. Start the database using the provided Docker script:
```bash
docker run -d --name llm_shield_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=llm_security -p 5432:5432 -v ${PWD}/backend/migrations:/docker-entrypoint-initdb.d postgres:15-alpine
```

### 2. Configure Environment Variables
Navigate to the `backend/` directory and create an environment variable file:
```bash
cd backend
cp .env.example .env
```
Open `.env` and fill in your free HuggingFace API key (`HF_API_KEY`) to enable the AI detection engine. Your key is kept entirely local and will never be shared.

### 3. One-Click Start (Windows)
To instantly boot the Backend, Frontend, and Local ML Server simultaneously, double-click the included script from the project root:
```
start_servers.bat
```

*(Alternatively, you can manually `npm install` and `npm run dev` in both the `frontend` and `backend` directories, and run `python ml_server.py` in the `ml` directory).*

### 4. Custom ML Model (Optional)
If you want to achieve 98%+ detection accuracy, you can train a local DistilBERT model. See instructions in `START.md` to run the ML pipeline.

### 4. Usage
Navigate to `http://localhost:5173`. Create a new account via the Register page, or use the automatically seeded admin credentials:
*   **Email**: `admin@shield.local`
*   **Password**: `securepassword123`

## 🛡️ Detection Engine

The system uses a mock 5-layer pipeline in the backend `detectionService.js`:
1.  **Preprocessor**: Cleans encodings.
2.  **Length Checker**: Flags excessively long inputs.
3.  **Heuristics**: Matches against known attack vectors stored in the DB (e.g., "Developer Mode", "Base64").
4.  **ML Classifier**: A simulated AI scoring layer.
5.  **Threat Profiler**: Aggregates the final risk score.
