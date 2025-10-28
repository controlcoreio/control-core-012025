# Control Core Storage Configuration
This document describes the configurable storage paths and persistent volume configuration for Control Core deployments.
## Overview
Control Core uses several types of persistent storage for different purposes:
1. **Application Data** - Core application data and configurations
2. **Database Storage** - PostgreSQL database files
3. **Cache Storage** - Redis cache data
4. **Log Storage** - Application and audit logs
5. **Backup Storage** - Backup files and archives
6. **Temporary Storage** - Temporary files and uploads
## Storage Paths
### Default Storage Structure
```
/opt/control-core/
├── cc-data/
│   ├── opal/          # OPAL server data and policy sync state
│   ├── postgresql/    # PostgreSQL database files
│   └── redis/         # Redis cache data
├── cc-logs/           # Application logs and audit trails
├── cc-backups/        # Backup files and archives
└── cc-temp/           # Temporary files and uploads
```
### Configurable Paths
All storage paths are configurable through Helm values:
```yaml
global:
  storage:
    basePath: "/opt/control-core"  # Base path for all storage
persistence:
  paths:
    opal:
      enabled: true
      path: "/opt/control-core/cc-data/opal"
      size: "5Gi"
      description: "OPAL server data and policy synchronization state"
      
    postgresql:
      enabled: true
      path: "/opt/control-core/cc-data/postgresql"
      size: "50Gi"
      description: "PostgreSQL database storage for all Control Core data"
      
    redis:
      enabled: true
      path: "/opt/control-core/cc-data/redis"
      size: "2Gi"
      description: "Redis cache storage for sessions and temporary data"
      
    logs:
      enabled: true
      path: "/opt/control-core/cc-logs"
      size: "20Gi"
      description: "Application logs and audit trails"
      
    backups:
      enabled: true
      path: "/opt/control-core/cc-backups"
      size: "100Gi"
      description: "Backup storage for disaster recovery"
      
    temp:
      enabled: true
      path: "/opt/control-core/cc-temp"
      size: "10Gi"
      description: "Temporary storage for file processing and uploads"
```
## Storage Classes
Control Core supports different storage classes based on your infrastructure:
### AWS EKS

```yaml
persistence:
  storageClass: "gp3"  # General Purpose SSD
  # Alternatives: "gp2", "io1", "io2"
```
### Google GKE

```yaml
persistence:
  storageClass: "ssd"  # SSD persistent disk
  # Alternatives: "standard", "premium-rwo"
```
### Azure AKS

```yaml
persistence:
  storageClass: "managed-premium"  # Premium SSD
  # Alternatives: "default"
```
### Local/On-Premises

```yaml
persistence:
  storageClass: "local-path"  # Local path provisioner
  # Alternatives: "hostpath"
```
## Component-Specific Storage
### Database Storage

```yaml
components:
  database:
    persistence:
      enabled: true
      storageClass: "gp3"
      accessModes:
        - ReadWriteOnce
      size: "50Gi"
      mountPath: "/var/lib/postgresql/data"
```
### Redis Cache Storage

```yaml
components:
  redis:
    persistence:
      enabled: true
      storageClass: "gp3"
      accessModes:
        - ReadWriteOnce
      size: "2Gi"
      mountPath: "/data"
```
### OPAL Server Storage

```yaml
components:
  opal:
    persistence:
      enabled: true
      storageClass: "gp3"
      accessModes:
        - ReadWriteOnce
      size: "5Gi"
      mountPath: "/app/data"
```
## Storage Sizing Guidelines
### Production Environments
| Component | Minimum Size | Recommended Size | Maximum Size |
|-----------|--------------|------------------|--------------|
| PostgreSQL | 20Gi | 100Gi | 1Ti |
| Redis | 1Gi | 5Gi | 20Gi |
| OPAL | 2Gi | 10Gi | 50Gi |
| Logs | 10Gi | 50Gi | 200Gi |
| Backups | 50Gi | 200Gi | 1Ti |
| Temp | 5Gi | 20Gi | 100Gi |
### Development Environments
| Component | Minimum Size | Recommended Size |
|-----------|--------------|------------------|
| PostgreSQL | 5Gi | 20Gi |
| Redis | 500Mi | 2Gi |
| OPAL | 1Gi | 5Gi |
| Logs | 2Gi | 10Gi |
| Backups | 10Gi | 50Gi |
| Temp | 1Gi | 5Gi |
## Security Configuration
### File Permissions

```yaml
security:
  permissions:
    owner: "1000:1000"  # User:Group ID
    mode: "0755"        # Directory permissions
    fileMode: "0644"    # File permissions
```
### Encryption at Rest

```yaml
security:
  encryption:
    enabled: true
    algorithm: "AES-256"
    keyManagement: "kubernetes"  # or "external"
```
## Backup Configuration
### Backup Schedule

```yaml
backup:
  enabled: true
  schedule: "0 2 * * *"  # Daily at 2 AM
  
  retention:
    days: 30
    weeks: 4
    months: 6
    
  storage:
    size: "100Gi"
    storageClass: "gp3"
```
### Backup Destinations

```yaml
backup:
  destinations:
    local:
      enabled: true
      path: "/backups/local"
      
    s3:
      enabled: false
      bucket: "control-core-backups"
      region: "us-east-1"
      prefix: "backups/"
```
## Logging Configuration
### Log Retention

```yaml
logging:
  retention:
    days: 30
    maxSize: "1Gi"
    
  levels:
    frontend: "info"
    pap-api: "info"
    bouncer: "info"
    pdp: "info"
    opal: "info"
    database: "warning"
```
## Performance Tuning
### I/O Optimization

```yaml
performance:
  io:
    scheduler: "mq-deadline"
    readAhead: "4096"
    
  memory:
    sharedBuffers: "256MB"
    effectiveCacheSize: "1GB"
    maxConnections: "100"
```
## Monitoring
### Storage Metrics

```yaml
monitoring:
  storage:
    enabled: true
    metrics:
      - disk_usage
      - disk_io
      - file_count
      
  alerts:
    diskUsage:
      warning: 80    # Percentage
      critical: 90   # Percentage
```
## Deployment Examples
### Basic Production Deployment

```yaml
# values-production.yaml

persistence:
  enabled: true
  storageClass: "gp3"
  
components:
  database:
    persistence:
      enabled: true
      size: "100Gi"
      
  redis:
    persistence:
      enabled: true
      size: "5Gi"
      
  opal:
    persistence:
      enabled: true
      size: "10Gi"
backup:
  enabled: true
  storage:
    size: "200Gi"
```
### High-Performance Deployment

```yaml
# values-high-performance.yaml

persistence:
  enabled: true
  storageClass: "io2"  # High IOPS storage
  
components:
  database:
    persistence:
      enabled: true
      size: "500Gi"
      storageClass: "io2"
      
performance:
  memory:
    sharedBuffers: "1GB"
    effectiveCacheSize: "4GB"
    maxConnections: "200"
```
### Development Deployment

```yaml
# values-development.yaml

persistence:
  enabled: true
  storageClass: "local-path"
  
components:
  database:
    persistence:
      enabled: true
      size: "10Gi"
      
  redis:
    persistence:
      enabled: true
      size: "1Gi"
      
backup:
  enabled: false
```
## Troubleshooting
### Common Issues
1. **Storage Class Not Found**
   ```bash
   kubectl get storageclass
   ```
   Ensure the specified storage class exists in your cluster.
2. **Insufficient Storage**
   ```bash
   kubectl describe pvc <pvc-name>
   ```
   Check if the PVC can be bound to a PV.
3. **Permission Issues**
   ```bash
   kubectl exec -it <pod-name> -- ls -la /var/lib/postgresql/data
   ```
   Verify file permissions in the mounted volume.
### Storage Commands

```bash
# Check PVC status

kubectl get pvc -n controlcore
# Check storage usage

kubectl exec -it <pod-name> -- df -h
# Check file permissions

kubectl exec -it <pod-name> -- ls -la /opt/control-core/data
# View storage events

kubectl get events --sort-by=.metadata.creationTimestamp
```
## Customer Customization
Customers can customize storage configuration by:
1. **Overriding base paths**:
   ```yaml
   global:
     storage:
       basePath: "/custom/path"
   ```
2. **Using different storage classes**:
   ```yaml
   persistence:
     storageClass: "customer-storage-class"
   ```
3. **Adjusting sizes**:
   ```yaml
   persistence:
     paths:
       postgresql:
         size: "200Gi"
   ```
4. **Disabling components**:
   ```yaml
   components:
     redis:
       persistence:
         enabled: false
   ```
## Support
For storage-related issues:
1. Check the storage configuration in your values file
2. Verify storage class availability in your cluster
3. Review PVC and PV status
4. Check application logs for storage-related errors
5. Contact support with storage configuration details
---
**Control Core Storage** - Flexible, secure, and configurable storage for all deployment scenarios.
