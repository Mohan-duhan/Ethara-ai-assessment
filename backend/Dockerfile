FROM python:3.11-slim

WORKDIR /workspace

# Install system dependencies if any are needed (none required for psycopg2-binary, but good for robustness)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Expose port
EXPOSE 8000

# Command to run backend server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
