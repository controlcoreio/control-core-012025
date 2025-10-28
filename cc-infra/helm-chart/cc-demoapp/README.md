# CC Demo App Helm Chart
This Helm chart deploys the Control Core Demo App application stack in a Kubernetes cluster.
## Components
The CC Demo App Stack consists of the following components:
- PostgreSQL database
- API backend with HTTP sidecar (in reverse proxy mode)
- Frontend application
## Prerequisites
- Kubernetes 1.16+
- Helm 3.0+
- PV provisioner support in the underlying infrastructure (for PostgreSQL persistence)
## Installing the Chart
To install the chart with the release name `acme`:
```bash
helm install acme ./helm-chart/acme-demo
```
## Configuration
The following table lists the configurable parameters of the ACME Stack chart and their default values.
### Global Parameters
| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.environment` | Environment name | `local-dev` |
| `global.stack` | Stack name | `acme-stack` |
### PostgreSQL Parameters
This chart depends on the Bitnami PostgreSQL Helm chart. The following table lists the configurable parameters of the PostgreSQL dependency and their default values.
| Parameter | Description | Default         |
|-----------|-------------|-----------------|
| `postgresql.enabled` | Enable PostgreSQL dependency | `true`          |
| `postgresql.auth.username` | PostgreSQL username | `postgres`      |
| `postgresql.auth.password` | PostgreSQL password | `password`      |
| `postgresql.auth.database` | PostgreSQL database name | `postgres` |
| `postgresql.image.tag` | PostgreSQL image tag | `15`            |
| `postgresql.primary.persistence.size` | PVC size | `1Gi`           |
| `postgresql.primary.resources.requests.memory` | Memory requests | `128Mi`         |
| `postgresql.primary.resources.requests.cpu` | CPU requests | `100m`          |
| `postgresql.primary.resources.limits.memory` | Memory limits | `256Mi`         |
| `postgresql.primary.resources.limits.cpu` | CPU limits | `500m`          |
| `postgresql.service.ports.postgresql` | PostgreSQL service port | `5432`          |
| `postgresql.initdb.scripts` | Map of initialization scripts | See `values.yaml` |
> **Note:** The chart is configured to create an additional database named `consulting_db` during PostgreSQL initialization. The API backend is configured to connect to this database.
For more information on the PostgreSQL Helm chart, see the [Bitnami PostgreSQL Helm chart documentation](https://github.com/bitnami/charts/tree/main/bitnami/postgresql).
### API Parameters
| Parameter | Description | Default |
|-----------|-------------|---------|
| `api.name` | API name | `acme-api` |
| `api.replicaCount` | Number of replicas | `1` |
| `api.deployment.image.repository` | Image repository | `acme-consulting-demo-api-api` |
| `api.deployment.image.tag` | Image tag | `latest` |
| `api.deployment.image.pullPolicy` | Image pull policy | `Never` |
| `api.service.type` | Service type | `NodePort` |
| `api.service.ports` | Service ports | See `values.yaml` |
### Sidecar Parameters
| Parameter | Description | Default |
|-----------|-------------|---------|
| `sidecar.name` | Sidecar name | `http-sidecar` |
| `sidecar.image.repository` | Image repository | `cc-http-sidecar-pep` |
| `sidecar.image.tag` | Image tag | `latest` |
| `sidecar.image.pullPolicy` | Image pull policy | `Never` |
### Frontend Parameters
| Parameter | Description | Default |
|-----------|-------------|---------|
| `frontend.name` | Frontend name | `acme-frontend` |
| `frontend.replicaCount` | Number of replicas | `1` |
| `frontend.image.repository` | Image repository | `acme-consulting-demo-frontend` |
| `frontend.image.tag` | Image tag | `latest` |
| `frontend.image.pullPolicy` | Image pull policy | `Never` |
| `frontend.service.type` | Service type | `NodePort` |
| `frontend.service.port` | Service port | `3000` |
| `frontend.service.nodePort` | Node port | `30300` |
## Accessing the Application
After deploying the chart, you can access the application at:
- Frontend: http://localhost:30300
- API: http://localhost:30800 (routes through sidecar)
