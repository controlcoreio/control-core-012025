# Control Core - Control Plane Docker Compose Deployment

This directory contains a production-ready Docker Compose configuration for deploying the complete Control Core Control Plane.

## What's Included

- **PAP API** (Backend): Policy Administration Point API
- **PAP UI** (Frontend): Web-based policy management interface
- **PostgreSQL**: Primary database for policies and configuration
- **Redis**: Cache for PIP metadata and session management
- **Signup Service**: User onboarding and subscription management

## Prerequisites

- Docker 20.10+
- Docker Compose v2.x
- 4GB RAM minimum (8GB recommended)
- 2 CPU cores minimum
- 20GB disk space
- Network access to Docker Hub

## Quick Start

### 1. Configure Environment

```bash
# Copy environment template
cp env.template .env

# Edit configuration
nano .env
```

### 2. Required Configuration

Edit `.env` and set these **required** values:

```bash
# Database password (use strong password)
POSTGRES_PASSWORD=your-strong-password-here

# API secrets (generate random keys)
SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
JWT_SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")

# Credential encryption (generate Fernet key)
CREDENTIAL_ENCRYPTION_KEY=$(python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")

# Admin password
ADMIN_PASS=your-admin-password-here

# Signup service secret
SIGNUP_SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
```

### 3. Start Services

```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### 4. Verify Deployment

```bash
# Check API health
curl http://localhost:8000/health

# Check UI is running
curl http://localhost:80
```

### 5. Access Control Plane

- **PAP UI**: http://localhost (or http://your-server-ip)
- **PAP API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Signup Service**: http://localhost:8002

**Default Login**:
- Username: `ccadmin` (or value of `ADMIN_USER`)
- Password: Value of `ADMIN_PASS` from `.env`

## Configuration Options

### Port Configuration

Change ports in `.env` if defaults conflict:

```bash
PAP_API_PORT=8000    # Backend API
PAP_UI_PORT=80       # Frontend UI
POSTGRES_PORT=5432   # Database
REDIS_PORT=6379      # Cache
SIGNUP_PORT=8002     # Signup service
```

### Database Configuration

```bash
POSTGRES_DB=control_core_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
```

### Redis Configuration

```bash
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password  # Leave empty for no password
```

### Security Configuration

```bash
# JWT token expiration (minutes)
JWT_EXPIRE_MINUTES=30

# Environment
ENVIRONMENT=production

# Logging level
LOG_LEVEL=info  # Options: debug, info, warning, error
```

### External Access Configuration

If accessing from different machine:

```bash
# Update PAP API URL to your server's IP or domain
PAP_API_URL=http://your-server-ip:8000
```

## Data Persistence

Data is persisted in Docker volumes:

- `cc_postgres_data`: Database data
- `cc_redis_data`: Redis persistence
- `cc_logs`: Application logs

### Backup Volumes

```bash
# Backup database
docker compose exec cc-db pg_dump -U postgres control_core_db > backup.sql

# Backup volumes
docker run --rm -v cc_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup-$(date +%Y%m%d).tar.gz /data
```

### Restore from Backup

```bash
# Restore database
cat backup.sql | docker compose exec -T cc-db psql -U postgres control_core_db
```

## Upgrading

### Update to New Version

```bash
# Set new version in .env
CC_VERSION=1.2.0

# Pull new images
docker compose pull

# Restart services
docker compose up -d

# Check logs for any issues
docker compose logs -f cc-pap-api
```

### Rollback

```bash
# Stop current version
docker compose down

# Set previous version in .env
CC_VERSION=1.1.0

# Start previous version
docker compose up -d
```

## Monitoring

### Health Checks

All services include health checks. View status:

```bash
docker compose ps
```

Healthy services show: `Up (healthy)`

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f cc-pap-api

# Last 100 lines
docker compose logs --tail=100 cc-pap-api
```

### Metrics

Metrics are available at:
- PAP API metrics: http://localhost:8000/metrics

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker compose logs

# Verify environment variables
docker compose config

# Check port conflicts
lsof -i :8000
lsof -i :80
```

### Database Connection Issues

```bash
# Check database is healthy
docker compose ps cc-db

# Test database connection
docker compose exec cc-db psql -U postgres -c "SELECT version();"

# Check database logs
docker compose logs cc-db
```

### Redis Connection Issues

```bash
# Check Redis is healthy
docker compose ps cc-redis

# Test Redis connection
docker compose exec cc-redis redis-cli ping

# Should return: PONG
```

### Cannot Access UI

```bash
# Check if PAP UI is running
docker compose ps cc-pap

# Check PAP UI logs
docker compose logs cc-pap

# Verify API URL configuration
docker compose exec cc-pap env | grep VITE_API_URL
```

### Reset Database

**⚠️ WARNING: This deletes all data**

```bash
# Stop services
docker compose down

# Remove volumes
docker volume rm cc_postgres_data cc_redis_data

# Start fresh
docker compose up -d
```

## Security Best Practices

1. **Change Default Passwords**: Never use default passwords in production
2. **Use Strong Secrets**: Generate cryptographically secure random keys
3. **Enable TLS**: Use reverse proxy (nginx, traefik) with SSL certificates
4. **Restrict Access**: Use firewall rules to limit access
5. **Regular Backups**: Schedule automated backups
6. **Monitor Logs**: Set up log aggregation and alerting
7. **Update Regularly**: Keep Control Core updated with latest security patches

## Production Checklist

- [ ] All secrets generated and configured
- [ ] Strong passwords for admin and database
- [ ] Environment set to `production`
- [ ] Backup strategy configured
- [ ] Monitoring and alerting set up
- [ ] TLS/SSL configured (via reverse proxy)
- [ ] Firewall rules configured
- [ ] Log aggregation configured
- [ ] Tested disaster recovery procedure
- [ ] Documented access procedures

## Next Steps

1. Configure your first bouncer
2. Set up GitHub policy repository
3. Create your first policy
4. Configure PIP data sources
5. Set up monitoring and alerting

## Support

- **Documentation**: https://docs.controlcore.io
- **GitHub Issues**: For Kickstart plan users
- **Email Support**: support@controlcore.io (Pro/Custom plans)

---

**Last Updated**: 2025-10-31

