# ControlCore Helm Charts
This directory contains Helm charts for deploying ControlCore services in Kubernetes.
## Available Charts
- [controlcore](./controlcore/README.md): A Helm chart for deploying the complete ControlCore stack
## Quick Start
1. Install the chart:
   ```bash
   helm install controlcore ./controlcore
   ```
2. Access the frontend at http://localhost
3. Uninstall by
   ```bash
   helm uninstall controlcore
    ```
## Testing
To test the chart without installing it:
```bash
./test-chart.sh
```
## Requirements
- Kubernetes 1.19+
- Helm 3.2.0+
- Nginx Ingress Controller installed in the cluster
## Additional Information
For more detailed information about the chart, see the [controlcore chart README](./controlcore/README.md).
