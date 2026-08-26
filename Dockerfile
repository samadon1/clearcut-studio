# CLEARCUT — single container running the FastAPI backend (127.0.0.1:8000)
# and the Next.js frontend (the exposed $PORT). They share the filesystem so the
# image features (Nano Banana rebrands, storyboard generation) work as they do locally.
FROM python:3.12-slim

# Node.js 20 for the Next.js frontend
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates gnupg fonts-dejavu-core \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend Python deps (cached unless requirements change)
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Frontend deps (cached unless lockfile changes)
COPY frontend/package.json frontend/package-lock.json frontend/
RUN cd frontend && npm ci

# App source
COPY . .

# Build the frontend; the browser talks to one origin and next.config proxies
# /api and /assets to the local FastAPI backend.
ENV NEXT_PUBLIC_API_URL=/api
RUN cd frontend && npm run build

ENV PORT=8080
EXPOSE 8080

CMD ["bash", "/app/start.sh"]
