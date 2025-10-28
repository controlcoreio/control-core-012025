# Control Core Customer Deployment Guide
This guide provides comprehensive instructions for deploying Control Core in customer environments with configurable storage paths.
## Overview
Control Core is designed for enterprise deployment with fully configurable storage paths that meet customer requirements. All storage directories (`data/`, `cc-logs/`, `opal/`) are configurable and can be customized based on your infrastructure needs.
## Pre-Deployment Requirements
### Infrastructure Requirements
- **Kubernetes Cluster**: Version 1.19 or higher
- **Helm**: Version 3.2.0 or higher
- **kubectl**: Configured for your cluster
- **Storage**: Persistent volume support (PVC)
### Storage Requirements
Control Core requires persistent storage for the following components:
1. **Database Storage** (PostgreSQL) - Primary data storage
2. **Cache Storage** (Redis) - Session and temporary data
3. **Policy Storage** (OPAL) - Policy synchronization data
4. **Log Storage** - Application and audit logs
5. **Backup Storage** - Backup files and archives
6. **Temporary Storage** - File uploads and processing
## Storage Configuration
### Understanding Storage Paths
The following directories are configurable in your deployment:
| Directory | Purpose | Default Path | Size |
|-----------|---------|--------------|------|
| `data/opal/` | OPAL server data and policy sync state | `/opt/control-core/data/opal` | 5Gi |
| `data/postgresql/` | PostgreSQL database files | `/opt/control-core/data/postgresql` | 50Gi |
| `data/redis/` | Redis cache data | `/opt/control-core/data/redis` | 2Gi |
| `cc-logs/` | Application logs and audit trails | `/opt/control-core/logs` | 20Gi |
| `backups/` | Backup files and archives | `/opt/control-core/backups` | 100Gi |
| `temp/` | Temporary files and uploads | `/opt/control-core/temp` | 10Gi |
### Customizing Storage Paths
Create a custom values file for your deployment:

```yaml
# custom-values.yaml

global:
  storage:
    basePath: "/var/lib/control-core"  # Your preferred base path
persistence:
  enabled: true
  storageClass: "your-storage-class"  # Your cluster's storage class
  
  paths:
    opal:
      enabled: true
      path: "/var/lib/control-core/data/opal"
      size: "10Gi"
      
    postgresql:
      enabled: true
      path: "/var/lib/control-core/data/postgresql"
      size: "100Gi"
      
    redis:
      enabled: true
      path: "/var/lib/control-core/data/redis"
      size: "5Gi"
      
    logs:
      enabled: true
      path: "/var/lib/control-core/logs"
      size: "50Gi"
      
    backups:
      enabled: true
      path: "/var/lib/control-core/backups"
      size: "200Gi"
      
    temp:
      enabled: true
      path: "/var/lib/control-core/temp"
      size: "20Gi"
# Component-specific storage configuration

components:
  database:
    persistence:
      enabled: true
      storageClass: "your-storage-class"
      size: "100Gi"
      mountPath: "/var/lib/postgresql/data"
      
  redis:
    persistence:
      enabled: true
      storageClass: "your-storage-class"
      size: "5Gi"
      mountPath: "/data"
      
  opal:
    persistence:
      enabled: true
      storageClass: "your-storage-class"
      size: "10Gi"
      mountPath: "/app/data"
# Logging configuration

logging:
  retention:
    days: 90  # Your retention policy
    maxSize: "2Gi"
    
  levels:
    frontend: "info"
    pap-api: "info"
    bouncer: "info"
    pdp: "info"
    opal: "info"
    database: "warning"
# Backup configuration

backup:
  enabled: true
  schedule: "0 3 * * *"  # Daily at 3 AM (your preferred time)
  
  retention:
    days: 30
    weeks: 4
    months: 6
    
  storage:
    size: "200Gi"
    storageClass: "your-storage-class"
```
## Storage Class Configuration
### AWS EKS

```yaml
persistence:
  storageClass: "gp3"  # General Purpose SSD v3
```
### Google GKE

```yaml
persistence:
  storageClass: "ssd"  # SSD persistent disk
```
### Azure AKS

```yaml
persistence:
  storageClass: "managed-premium"  # Premium SSD
```
### On-Premises/Local

```yaml
persistence:
  storageClass: "local-path"  # Local path provisioner
```
## Deployment Steps
### 1. Prepare Your Environment

```bash
# Create namespace

kubectl create namespace controlcore
# Verify storage classes

kubectl get storageclass
```
### 2. Deploy Control Core

```bash
# Deploy with custom values

helm install controlcore ./helm-chart/controlcore \
  --namespace controlcore \
  --values custom-values.yaml \
  --values values-customer.yaml
```
### 3. Verify Deployment

```bash
# Check pods

kubectl get pods -n controlcore
# Check persistent volume claims

kubectl get pvc -n controlcore
# Check storage usage

kubectl exec -it deployment/cc-database -n controlcore -- df -h
```
### 4. Access the Application

```bash
# Port forward to frontend

kubectl port-forward -n controlcore svc/cc-frontend 3000:3000
# Port forward to API

kubectl port-forward -n controlcore svc/cc-pap 8082:8082
```
## Storage Monitoring
### Check Storage Usage

```bash
# Check PVC status

kubectl get pvc -n controlcore
# Check storage usage in pods

kubectl exec -it deployment/cc-database -n controlcore -- df -h /var/lib/postgresql/data
kubectl exec -it deployment/cc-redis -n controlcore -- df -h /data
kubectl exec -it deployment/cc-opal -n controlcore -- df -h /app/data
```
### Monitor Storage Performance

```bash
# Check storage events

kubectl get events -n controlcore --sort-by=.metadata.creationTimestamp
# Check storage metrics (if metrics server is available)

kubectl top pvc -n controlcore
```
## Backup and Recovery
### Manual Backup

```bash
# Database backup

kubectl exec -it deployment/cc-database -n controlcore -- pg_dump -U postgres control_core_db > backup.sql
# Configuration backup

kubectl get configmap -n controlcore -o yaml > config-backup.yaml
kubectl get secret -n controlcore -o yaml > secrets-backup.yaml
```
### Automated Backup
Backups are automatically configured based on your values:
```yaml
backup:
  enabled: true
  schedule: "0 3 * * *"  # Daily at 3 AM
  
  retention:
    days: 30
    weeks: 4
    months: 6
```
## Security Configuration
### File Permissions
```yaml
security:
  permissions:
    owner: "1000:1000"  # Adjust based on your security requirements
    mode: "0755"
    fileMode: "0644"
```
### Encryption at Rest
If your storage class supports encryption:
```yaml
security:
  encryption:
    enabled: true
    algorithm: "AES-256"
    keyManagement: "kubernetes"
```
## Troubleshooting
### Common Storage Issues
1. **PVC Not Bound**
   ```bash
   kubectl describe pvc <pvc-name> -n controlcore
   ```
   Check for storage class availability and capacity.
2. **Permission Denied**
   ```bash
   kubectl exec -it <pod-name> -n controlcore -- ls -la /var/lib/postgresql/data
   ```
   Verify file permissions and ownership.
3. **Storage Full**
   ```bash
   kubectl exec -it <pod-name> -n controlcore -- df -h
   ```
   Check disk usage and increase PVC size if needed.
### Storage Commands

```bash
# Check all storage resources

kubectl get pv,pvc -n controlcore
# Describe storage issues

kubectl describe pvc <pvc-name> -n controlcore
# Check pod storage mounts

kubectl describe pod <pod-name> -n controlcore
# View storage events

kubectl get events -n controlcore --field-selector reason=FailedMount
```
## Performance Tuning
### Database Performance
```yaml
performance:
  memory:
    sharedBuffers: "512MB"
    effectiveCacheSize: "2GB"
    maxConnections: "200"
```
### I/O Optimization
```yaml
performance:
  io:
    scheduler: "mq-deadline"
    readAhead: "8192"
```
## Customer Support
### Information to Provide
When contacting support, please provide:
1. **Storage Configuration**:
   ```bash
   kubectl get pvc -n controlcore -o yaml
   ```
2. **Storage Events**:
   ```bash
   kubectl get events -n controlcore --sort-by=.metadata.creationTimestamp
   ```
3. **Pod Logs**:
   ```bash
   kubectl logs -n controlcore deployment/cc-database
   kubectl logs -n controlcore deployment/cc-opal
   ```
4. **Storage Usage**:
   ```bash
   kubectl exec -it deployment/cc-database -n controlcore -- df -h
   ```
### Support Contacts
- **Technical Support**: support@controlcore.io
- **Documentation**: docs@controlcore.io
- **Emergency**: emergency@controlcore.io
## Appendix
### Default Storage Paths
| Component | Default Path | Purpose |
|-----------|--------------|---------|
| Database | `/var/lib/postgresql/data` | PostgreSQL data files |
| Redis | `/data` | Redis cache data |
| OPAL | `/app/data` | OPAL server data |
| Logs | `/opt/control-core/logs` | Application logs |
| Backups | `/opt/control-core/backups` | Backup files |
| Temp | `/opt/control-core/temp` | Temporary files |
### Storage Size Recommendations
| Environment | Database | Redis | OPAL | Logs | Backups | Temp |
|-------------|----------|-------|------|------|---------|------|
| Development | 10Gi | 1Gi | 2Gi | 5Gi | 20Gi | 2Gi |
| Staging | 50Gi | 3Gi | 5Gi | 20Gi | 100Gi | 10Gi |
| Production | 200Gi | 10Gi | 20Gi | 100Gi | 500Gi | 50Gi |
---
**Control Core Customer Deployment** - Secure, scalable, and configurable for your enterprise needs.
