FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create packages directory
RUN mkdir -p /app/packages

# Expose port
EXPOSE 8000

# Run the application using run_on_8002.py (which serves both API and frontend)
CMD ["python", "run_on_8002.py"]
