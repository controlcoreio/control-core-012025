# PEP Configuration Field Reference

Quick reference guide for all PEP configuration fields and their purposes.

---

## Global Configuration Fields

### Common Configuration (All Bouncer Types)

| Field | Type | Default | Description | Validation |
|-------|------|---------|-------------|------------|
| `control_plane_url` | String | `https://api.controlcore.io` | Base URL for bouncers to connect to Control Plane | Valid URL format |

---

### Reverse-Proxy Specific Configuration

| Field | Type | Default | Description | Validation |
|-------|------|---------|-------------|------------|
| `default_proxy_domain` | String | `bouncer.controlcore.io` | Base domain for all reverse-proxy bouncer URLs | Valid domain format |

**Use Cases:**
- Setting up reverse-proxy bouncers that need public URLs
- Automatically generating bouncer URLs like `api-prod.bouncer.yourcompany.com`
- DNS wildcard configuration for multiple bouncers

---

### Sidecar Specific Configuration

| Field | Type | Default | Description | Validation |
|-------|------|---------|-------------|------------|
| `default_sidecar_port` | Integer | `8080` | Default port for sidecar containers to listen on | 1-65535 |
| `sidecar_injection_mode` | String | `automatic` | How sidecars are injected into pods | `automatic` or `manual` |
| `sidecar_namespace_selector` | String | `null` | K8s namespace label selector for auto-injection | Valid label selector |
| `sidecar_resource_limits_cpu` | String | `500m` | CPU limit for sidecar containers | K8s CPU format |
| `sidecar_resource_limits_memory` | String | `256Mi` | Memory limit for sidecar containers | K8s memory format |
| `sidecar_init_container_enabled` | Boolean | `true` | Use init container to configure iptables rules | true/false |

**Use Cases:**

**`default_sidecar_port`**:
- Define which port sidecar containers listen on
- Avoid conflicts with application ports
- Standardize across all sidecar deployments

**`sidecar_injection_mode`**:
- `automatic`: Sidecars auto-inject into pods matching namespace selector
- `manual`: Sidecars require explicit annotation on pods

**`sidecar_namespace_selector`**:
- Example: `app=myapp,tier=backend`
- Controls which K8s namespaces get automatic sidecar injection
- Leave empty to disable automatic injection

**`sidecar_resource_limits_cpu`**:
- Example values: `500m`, `1`, `2`, `0.5`
- Prevents sidecar from consuming excessive CPU
- Ensures consistent resource allocation

**`sidecar_resource_limits_memory`**:
- Example values: `256Mi`, `512Mi`, `1Gi`, `2Gi`
- Prevents sidecar OOM (Out of Memory) kills
- Balances between performance and resource usage

**`sidecar_init_container_enabled`**:
- `true`: Uses init container to set up iptables for traffic interception
- `false`: Sidecars must configure iptables themselves (advanced use case)

---

### Policy Update & Synchronization (All Bouncer Types)

| Field | Type | Default | Description | Validation |
|-------|------|---------|-------------|------------|
| `policy_update_interval` | Integer | `30` | How often bouncers poll for policy updates (seconds) | 10-300 |
| `bundle_download_timeout` | Integer | `10` | Max time to wait for policy bundle download (seconds) | 5-60 |
| `policy_checksum_validation` | Boolean | `true` | Verify policy bundle integrity with checksums | true/false |

---

### Decision Logging & Metrics (All Bouncer Types)

| Field | Type | Default | Description | Validation |
|-------|------|---------|-------------|------------|
| `decision_log_export_enabled` | Boolean | `true` | Export decision logs to Control Plane | true/false |
| `decision_log_batch_size` | Integer | `100` | Number of logs to batch before sending | 1-1000 |
| `decision_log_flush_interval` | Integer | `5` | Max time before flushing logs (seconds) | 1-30 |
| `metrics_export_enabled` | Boolean | `true` | Export bouncer metrics to Control Plane | true/false |

---

### Enforcement Behavior (All Bouncer Types)

| Field | Type | Default | Description | Validation |
|-------|------|---------|-------------|------------|
| `fail_policy` | String | `fail-closed` | Bouncer behavior when Control Plane is unreachable | `fail-closed` or `fail-open` |
| `default_security_posture` | String | `deny-all` | Default posture for new resources | `deny-all` or `allow-all` |

**Fail Policy Explanation:**
- `fail-closed`: Deny all requests if Control Plane is unreachable (secure, but less available)
- `fail-open`: Allow all requests if Control Plane is unreachable (available, but less secure)

---

### Performance & Limits (All Bouncer Types)

| Field | Type | Default | Description | Validation |
|-------|------|---------|-------------|------------|
| `default_rate_limit` | Integer | `1000` | Default rate limit (requests/minute) | ≥1 |
| `default_timeout` | Integer | `30` | Default request timeout (seconds) | 5-300 |
| `max_connections` | Integer | `500` | Maximum concurrent connections | 10-10000 |

---

### Security & TLS (All Bouncer Types)

| Field | Type | Default | Description | Validation |
|-------|------|---------|-------------|------------|
| `auto_ssl_enabled` | Boolean | `true` | Auto-provision SSL certificates (Let's Encrypt) | true/false |
| `mutual_tls_required` | Boolean | `false` | Require client certificates for PEP-Control Plane communication | true/false |

---

## Individual Bouncer Configuration Fields

### Policy Assignment (All Bouncer Types)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `assigned_policy_bundles` | Array | `["default"]` | Policy bundles this bouncer should enforce |

---

### MCP Context Injection (All Bouncer Types)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `mcp_header_name` | String | `X-Model-Context` | HTTP header name for MCP payload |
| `mcp_injection_enabled` | Boolean | `true` | Enable PEP to inject MCP context |

---

### Reverse-Proxy Configuration

| Field | Type | Default | Description | Validation |
|-------|------|---------|-------------|------------|
| `upstream_target_url` | String | `null` | Protected service URL (where to forward requests) | Valid URL |
| `public_proxy_url` | String | `null` | Public URL where this bouncer is accessible | Valid URL |
| `proxy_timeout` | Integer | `30` | Max time to wait for upstream response (seconds) | 5-300 |

---

### Sidecar Configuration

| Field | Type | Default | Description | Validation |
|-------|------|---------|-------------|------------|
| `sidecar_port_override` | Integer | `null` | Override global sidecar port for this bouncer | 1-65535 |
| `sidecar_traffic_mode` | String | `iptables` | Traffic interception mechanism | See below |
| `sidecar_resource_cpu_override` | String | `null` | Override CPU limit for this sidecar | K8s CPU format |
| `sidecar_resource_memory_override` | String | `null` | Override memory limit for this sidecar | K8s memory format |

**Traffic Interception Modes:**
- `iptables`: Direct iptables-based traffic redirection (default, works everywhere)
- `istio`: Integrate with Istio service mesh
- `linkerd`: Integrate with Linkerd service mesh
- `envoy`: Use Envoy proxy for traffic interception

---

### Resource Identification Rules (All Bouncer Types)

| Field | Type | Description |
|-------|------|-------------|
| `resource_identification_rules` | Array | Rules to identify logical resources from requests |

**Rule Format:**
```json
{
  "type": "path_prefix",  // or "host_name", "header"
  "value": "/v1/models/",  // pattern to match
  "resource_name": "AI Models API"  // logical resource name
}
```

---

### Cache Configuration (All Bouncer Types)

| Field | Type | Default | Description | Validation |
|-------|------|---------|-------------|------------|
| `cache_enabled` | Boolean | `true` | Enable response caching | true/false |
| `cache_ttl` | Integer | `300` | Cache TTL in seconds | 1-3600 |
| `cache_max_size` | Integer | `100` | Max cache size in MB | 1-1000 |
| `cache_invalidation_strategy` | String | `lru` | Cache eviction strategy | `lru`, `lfu`, or `ttl` |

---

### Circuit Breaker (All Bouncer Types)

| Field | Type | Default | Description | Validation |
|-------|------|---------|-------------|------------|
| `circuit_breaker_enabled` | Boolean | `true` | Enable circuit breaker | true/false |
| `circuit_breaker_failure_threshold` | Integer | `5` | Failures before opening circuit | 1-100 |
| `circuit_breaker_success_threshold` | Integer | `2` | Successes before closing circuit | 1-10 |
| `circuit_breaker_timeout` | Integer | `60` | Circuit open timeout (seconds) | 10-300 |

---

### Load Balancing (All Bouncer Types)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `load_balancing_algorithm` | String | `round-robin` | Load balancing algorithm |
| `sticky_sessions_enabled` | Boolean | `false` | Enable sticky sessions |

**Load Balancing Algorithms:**
- `round-robin`: Distribute requests evenly across instances
- `least-connections`: Send to instance with fewest connections
- `ip-hash`: Hash client IP to determine instance
- `weighted`: Weighted round-robin based on capacity

---

### Override Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `policy_update_interval_override` | Integer | `null` | Override global policy update interval |
| `fail_policy_override` | String | `null` | Override global fail policy |
| `rate_limit_override` | Integer | `null` | Override global rate limit |

---

## Configuration Hierarchy

Configuration is applied in the following order (later overrides earlier):

1. **Global Defaults** (`global_pep_config` table)
2. **Individual Overrides** (`individual_pep_config` table)
3. **Environment Variables** (if deployed bouncer has env vars set)

**Example:**
- Global `default_sidecar_port` = `8080`
- Individual bouncer `sidecar_port_override` = `9090`
- **Effective port** = `9090`

---

## Common Configuration Patterns

### Pattern 1: Uniform Configuration
All bouncers use global defaults with no individual overrides.

**Use Case**: Simple deployments where all bouncers are similar.

### Pattern 2: Environment-Specific
Different settings for sandbox vs production bouncers.

**Example**:
- Sandbox: `fail_policy` = `fail-open`, `rate_limit` = `1000`
- Production: `fail_policy` = `fail-closed`, `rate_limit` = `5000`

### Pattern 3: Resource-Constrained
Sidecars in resource-limited environments get lower limits.

**Example**:
- Default: `512Mi` memory, `1` CPU
- Dev cluster bouncer override: `256Mi` memory, `500m` CPU

### Pattern 4: Service Mesh Integration
Sidecars in Istio-enabled namespaces use Istio traffic mode.

**Example**:
- Global: `sidecar_traffic_mode` = `iptables`
- Istio bouncer override: `sidecar_traffic_mode` = `istio`

---

## Validation Rules

### Port Numbers
- Range: 1-65535
- Common choices: 8080, 8443, 9090

### CPU Limits
- Format: `<number>` or `<number>m`
- Examples: `0.5`, `500m`, `1`, `2`
- `1000m` = `1` CPU core

### Memory Limits
- Format: `<number><unit>`
- Units: `Mi` (mebibytes), `Gi` (gibibytes)
- Examples: `256Mi`, `512Mi`, `1Gi`, `2Gi`

### URL Formats
- Must start with `http://` or `https://`
- Must include domain
- Examples: `https://api.example.com`, `http://localhost:8000`

### Label Selectors
- Format: `key=value,key2=value2`
- Examples: `app=myapp`, `app=web,tier=frontend`

---

## Best Practices

### 1. Resource Limits
- Start conservative, increase if needed
- Monitor actual usage before adjusting
- Sidecar typically needs: 256Mi-512Mi memory, 200m-500m CPU

### 2. Ports
- Use standard ports (8080, 8443) unless conflicts exist
- Document any custom ports
- Ensure firewall rules allow bouncer ports

### 3. Fail Policy
- Production: Use `fail-closed` for security
- Development: Use `fail-open` for availability
- Test thoroughly before production use

### 4. Rate Limits
- Base on expected traffic
- Add 20-30% buffer
- Monitor and adjust based on actual patterns

### 5. Caching
- Enable for read-heavy workloads
- Disable for real-time data
- Tune TTL based on data freshness requirements

---

**Last Updated**: November 1, 2025  
**Documentation Version**: 1.0.0

