#!/usr/bin/env bash
set -e

# FastAPI backend on an internal port; the frontend proxies to it.
cd /app/backend
PYTHONPATH=/app/backend python -m uvicorn main:app --host 127.0.0.1 --port 8000 &

# Next.js frontend on the port Cloud Run expects (foreground = container lifecycle).
cd /app/frontend
exec npm run start -- -p "${PORT:-8080}" -H 0.0.0.0
