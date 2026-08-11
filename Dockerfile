# Single-image deployment (DEC-017): build the SPA, serve it from FastAPI.

FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
RUN useradd --create-home --shell /usr/sbin/nologin radar
WORKDIR /radar

COPY backend /radar/backend
RUN pip install --no-cache-dir /radar/backend

COPY data /radar/data
COPY --from=web /web/dist /radar/frontend/dist

# SQLite lives on a mounted volume at /data; seed/registry files stay in the image.
ENV DATABASE_URL=sqlite:////data/radar.db \
    DATA_DIR=/radar/data \
    SPA_DIR=/radar/frontend/dist \
    API_HOST=0.0.0.0 \
    PYTHONUNBUFFERED=1
RUN mkdir /data && chown radar:radar /data
VOLUME /data

USER radar
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--app-dir", "/radar/backend", "--host", "0.0.0.0", "--port", "8000"]
