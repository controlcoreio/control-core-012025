# ---- Base Stage ----
FROM python:3.11.8-slim as base

# Set working directory
WORKDIR /app

# Install system dependencies including git for GitHub operations
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    curl \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Regal for Rego linting (optional - skip if not available for architecture)
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then \
        REGAL_ARCH="arm64"; \
    else \
        REGAL_ARCH="x86_64"; \
    fi && \
    (curl -fsSL "https://github.com/StyraInc/regal/releases/download/v0.27.0/regal_Linux_${REGAL_ARCH}.tar.gz" \
    | tar xz -C /usr/local/bin/ && \
    chmod +x /usr/local/bin/regal && \
    regal version) || echo "Regal installation skipped (not critical for operation)"

# ---- Builder Stage ----
FROM base as builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends build-essential

# Copy requirements and install dependencies
COPY cc-pap-api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---- Final Stage ----
FROM base as final

# Create non-root user and necessary directories
RUN useradd --create-home --shell /bin/bash app && \
    mkdir -p /home/app/config /home/app/policies /home/app/logs && \
    chown -R app:app /home/app

WORKDIR /home/app
USER app

# Copy installed packages from builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY cc-pap-api/ .

# Copy policy templates from cc-pap-core
COPY cc-pap-core/policy-templates/ /home/cc-pap-core/policy-templates/

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
