# Control Core Auto-Scaling Configuration

This directory contains auto-scaling configurations for Control Core platform to handle varying loads and performance requirements.

## Overview

Control Core supports auto-scaling for:

- **Control Core Frontend**: Admin UI scaling
- **PAP API**: Policy Administration Point scaling
- **The Bouncer**: Policy Enforcement Point scaling
- **Multiple Bouncer Instances**: Resource-specific scaling

## Auto-Scaling Features

### 1. Horizontal Pod Autoscaler (HPA)

- **CPU-based scaling**: Scale based on CPU utilization
- **Memory-based scaling**: Scale based on memory utilization
- **Custom metrics**: Scale based on custom application metrics
- **Behavioral scaling**: Configurable scale-up/scale-down behavior

### 2. Resource-Specific Scaling

- **AI Agent Bouncer**: High-scale for AI workloads (1-15 replicas)
- **API Gateway Bouncer**: Medium-scale for API traffic (1-8 replicas)
- **LLM Service Bouncer**: High-scale for LLM requests (1-15 replicas)
- **RAG Tool Bouncer**: Medium-scale for RAG operations (1-6 replicas)
- **Git Repository Bouncer**: Low-scale for Git operations (1-4 replicas)

## Configuration

### Default Scaling Parameters

#### Frontend

```yaml
autoscaling:
  enabled: true
  minReplicas: 1
  maxReplicas: 5
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

#### PAP API

```yaml
autoscaling:
  enabled: true
  minReplicas: 1
  maxReplicas: 8
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

#### Bouncer (Default)

```yaml
autoscaling:
  enabled: true
  minReplicas: 1
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

### Resource-Specific Scaling

#### AI Agent Bouncer

```yaml
ai-agent:
  autoscaling:
    enabled: true
    minReplicas: 1
    maxReplicas: 15
    targetCPUUtilizationPercentage: 60
```

#### API Gateway Bouncer

```yaml
api-gateway:
  autoscaling:
    enabled: true
    minReplicas: 1
    maxReplicas: 8
    targetCPUUtilizationPercentage: 70
```

#### LLM Service Bouncer

```yaml
llm-service:
  autoscaling:
    enabled: true
    minReplicas: 1
    maxReplicas: 15
    targetCPUUtilizationPercentage: 65
```

## Scaling Behavior

### Scale-Up Behavior

- **Stabilization Window**: 60 seconds
- **Scale-Up Policies**:
  - 100% increase every 15 seconds
  - Add 2 pods every 15 seconds
- **Maximum Scale-Up Rate**: 2 pods per 15 seconds

### Scale-Down Behavior

- **Stabilization Window**: 300 seconds (5 minutes)
- **Scale-Down Policies**:
  - 10% decrease every 60 seconds
- **Maximum Scale-Down Rate**: 10% per minute

## Monitoring

### Metrics Collection

- **CPU Utilization**: Real-time CPU usage monitoring
- **Memory Utilization**: Memory usage tracking
- **Request Rate**: HTTP request rate monitoring
- **Response Time**: Average response time tracking
- **Error Rate**: Error rate monitoring

### Metrics Endpoints

- **Frontend Metrics**: `http://frontend:9090/metrics`
- **PAP API Metrics**: `http://cc-pap:9090/metrics`
- **Bouncer Metrics**: `http://bouncer:9090/metrics`

## Deployment Options

### 1. Helm Chart Deployment

```bash
# Deploy with auto-scaling enabled

helm install controlcore ./helm-chart/controlcore \
  --set frontend.autoscaling.enabled=true \
  --set policyAdminApi.autoscaling.enabled=true \
  --set bouncer.autoscaling.enabled=true
```

### 2. Kubernetes Manifest Deployment

```bash
# Deploy with HPA

kubectl apply -f k8s/controlcore-stack-new.yaml
```

### 3. Docker Compose (Limited Scaling)

```bash
# Deploy with resource limits

docker-compose -f controlcore-compose.yml up -d
```

## Performance Tuning

### Resource Requests and Limits

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "500m"
```

### Scaling Thresholds

- **CPU Threshold**: 70% utilization
- **Memory Threshold**: 80% utilization
- **Custom Metrics**: Configurable per service

## Multiple Bouncer Deployment

### Resource Types Supported

1. **AI Agent**: OpenAI, Anthropic, Azure AI, Google Gemini
2. **API Gateway**: Kong, Tyk, AWS API Gateway, Azure API Management
3. **LLM Service**: Custom LLM services, model endpoints
4. **RAG Tool**: Vector databases, search services
5. **Git Repository**: Source code repositories
6. **Application**: Web applications, microservices

### Bouncer Configuration

```yaml
bouncers:
  ai-agent:
    enabled: true
    resourceType: "ai_agent"
    targetHost: "your-ai-agent:8000"
    port: 8081
    autoscaling:
      enabled: true
      minReplicas: 1
      maxReplicas: 15
```

## Monitoring and Alerting

### Key Metrics

- **Pod Count**: Current number of running pods
- **CPU Usage**: Average CPU utilization
- **Memory Usage**: Average memory utilization
- **Request Rate**: Requests per second
- **Response Time**: Average response time
- **Error Rate**: Percentage of failed requests

### Alerting Rules

- **High CPU Usage**: > 80% for 5 minutes
- **High Memory Usage**: > 90% for 5 minutes
- **High Error Rate**: > 5% for 2 minutes
- **Scaling Events**: Scale-up/scale-down notifications

## Troubleshooting

### Common Issues

1. **Scaling Not Working**
   - Check HPA status: `kubectl get hpa`
   - Verify metrics server: `kubectl top pods`
   - Check resource requests/limits
2. **Too Aggressive Scaling**
   - Adjust scaling thresholds
   - Modify stabilization windows
   - Review scaling policies
3. **Scaling Too Slow**
   - Reduce stabilization windows
   - Increase scaling percentages
   - Check resource constraints

### Debug Commands

```bash
# Check HPA status

kubectl get hpa
# View HPA details

kubectl describe hpa cc-frontend-hpa
# Check pod metrics

kubectl top pods
# View scaling events

kubectl get events --sort-by=.metadata.creationTimestamp
```

## Best Practices

### 1. Resource Planning

- Set appropriate resource requests
- Configure realistic limits
- Monitor resource usage patterns

### 2. Scaling Configuration

- Start with conservative thresholds
- Monitor scaling behavior
- Adjust based on workload patterns

### 3. Performance Optimization

- Use horizontal scaling over vertical scaling
- Implement proper health checks
- Monitor application performance

### 4. Cost Optimization

- Set appropriate min/max replicas
- Use spot instances where possible
- Monitor and optimize resource usage

## Security Considerations

### Network Security

- All services on internal networks
- No external port exposure
- TLS termination at ingress

### Resource Isolation

- Separate namespaces for different environments
- Resource quotas and limits
- Network policies for traffic control

## Support

For auto-scaling issues:

1. Check HPA status and events
2. Verify metrics collection
3. Review resource constraints
4. Monitor scaling behavior
5. Contact support if needed

## License

This configuration follows the same license as Control Core platform.
