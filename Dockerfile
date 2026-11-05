FROM python:3.10-slim

WORKDIR /app

# Install CPU PyTorch and backend requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r backend/requirements.txt

# Copy backend and prebuilt frontend static assets
COPY backend/ ./backend/
COPY frontend/dist/ ./frontend/dist/

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "server:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000"]
