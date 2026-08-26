#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "=========================================================="
echo "  🎬 CLEARCUT: Production Clearance Intelligence Platform"
echo "  Google Gemini + Parallel Search API"
echo "=========================================================="

# Start Backend API
echo "Starting CLEARCUT Backend (FastAPI) on http://localhost:8000 ..."
cd "$DIR/backend"
PYTHONPATH=. "$DIR/backend/venv/bin/uvicorn" main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start Frontend
echo "Starting CLEARCUT Frontend (Next.js) on http://localhost:3000 ..."
cd "$DIR/frontend"
npm run dev -- -p 3000 &
FRONTEND_PID=$!

cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo "🚀 CLEARCUT is live!"
echo "   - Frontend UI: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs:    http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to terminate all services."

wait
