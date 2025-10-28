# ---- Base Stage ----
FROM golang:1.21-alpine as base

# Set working directory
WORKDIR /app

# Install dependencies
RUN apk add --no-cache git ca-certificates

# ---- Builder Stage ----
FROM base as builder

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o bouncer .

# ---- Final Stage ----
FROM alpine:latest

# Install ca-certificates for HTTPS requests and create non-root user
RUN apk --no-cache add ca-certificates curl && \
    adduser -D -s /bin/sh bouncer

# Set working directory
WORKDIR /app

# Copy binary from builder stage
COPY --from=builder /app/bouncer .

# Change ownership to non-root user
RUN chown -R bouncer:bouncer /app

# Switch to non-root user
USER bouncer

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run the application
CMD ["./bouncer"]
