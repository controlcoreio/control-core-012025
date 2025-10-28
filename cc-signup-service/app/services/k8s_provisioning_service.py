"""
Kubernetes Provisioning Service for Control Core Pro Tenants
Handles automated deployment of cc-pap-pro-tenant instances
"""

import os
import logging
import yaml
import subprocess
import tempfile
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path
import aiohttp
import asyncio

logger = logging.getLogger(__name__)

class K8sProvisioningService:
    def __init__(self):
        self.kubeconfig_path = os.getenv("KUBECONFIG_PATH")
        self.helm_chart_path = os.getenv("HELM_CHART_PATH", "/app/helm-charts/controlcore")
        self.dns_provider = os.getenv("DNS_PROVIDER", "cloudflare")
        self.dns_api_key = os.getenv("DNS_API_KEY")
        self.dns_zone_id = os.getenv("DNS_ZONE_ID")
        self.base_domain = os.getenv("BASE_DOMAIN", "app.controlcore.io")
        
        # SSL certificate settings
        self.ssl_email = os.getenv("SSL_EMAIL", "admin@controlcore.io")
        self.letsencrypt_staging = os.getenv("LETSENCRYPT_STAGING", "true").lower() == "true"
    
    async def provision_tenant(self, tenant_id: str, company_name: str, subdomain: str, tier: str) -> Dict[str, Any]:
        """Provision a new Pro tenant with Kubernetes deployment"""
        try:
            logger.info(f"Starting provisioning for tenant {tenant_id}")
            
            # Generate namespace
            namespace = f"tenant-{tenant_id[:8]}"
            
            # Create namespace
            await self._create_namespace(namespace)
            
            # Generate Helm values
            helm_values = await self._generate_helm_values(tenant_id, company_name, subdomain, tier)
            
            # Deploy with Helm
            deployment_result = await self._deploy_with_helm(namespace, helm_values)
            
            # Configure DNS
            dns_result = await self._configure_dns(subdomain)
            
            # Request SSL certificate
            ssl_result = await self._request_ssl_certificate(subdomain, namespace)
            
            # Wait for deployment to be ready
            await self._wait_for_deployment_ready(namespace)
            
            # Initialize tenant data
            await self._initialize_tenant_data(tenant_id, namespace)
            
            result = {
                "namespace": namespace,
                "subdomain": subdomain,
                "domain": f"https://{subdomain}",
                "deployment_status": "ready",
                "dns_configured": dns_result["success"],
                "ssl_configured": ssl_result["success"],
                "helm_deployment": deployment_result,
                "provisioned_at": datetime.utcnow().isoformat()
            }
            
            logger.info(f"Successfully provisioned tenant {tenant_id}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to provision tenant {tenant_id}: {str(e)}")
            # Cleanup on failure
            await self._cleanup_failed_provisioning(tenant_id, namespace)
            raise
    
    async def _create_namespace(self, namespace: str):
        """Create Kubernetes namespace"""
        try:
            cmd = ["kubectl", "create", "namespace", namespace]
            if self.kubeconfig_path:
                cmd.extend(["--kubeconfig", self.kubeconfig_path])
            
            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await result.communicate()
            
            if result.returncode != 0 and "already exists" not in stderr.decode():
                raise Exception(f"Failed to create namespace: {stderr.decode()}")
            
            logger.info(f"Created namespace: {namespace}")
            
        except Exception as e:
            logger.error(f"Failed to create namespace {namespace}: {e}")
            raise
    
    async def _generate_helm_values(self, tenant_id: str, company_name: str, subdomain: str, tier: str) -> Dict[str, Any]:
        """Generate Helm values for tenant deployment"""
        values = {
            "tenant": {
                "id": tenant_id,
                "name": company_name,
                "subdomain": subdomain,
                "tier": tier
            },
            "ingress": {
                "enabled": True,
                "hosts": [{
                    "host": subdomain,
                    "paths": ["/"]
                }],
                "tls": [{
                    "secretName": f"{tenant_id}-tls",
                    "hosts": [subdomain]
                }]
            },
            "database": {
                "enabled": True,
                "name": f"controlcore-{tenant_id[:8]}",
                "username": f"cc_{tenant_id[:8]}",
                "password": self._generate_password()
            },
            "redis": {
                "enabled": True,
                "name": f"redis-{tenant_id[:8]}"
            },
            "opa": {
                "enabled": True,
                "name": f"opa-{tenant_id[:8]}"
            },
            "opal": {
                "enabled": True,
                "name": f"opal-{tenant_id[:8]}"
            },
            "resources": {
                "requests": {
                    "memory": "512Mi",
                    "cpu": "250m"
                },
                "limits": {
                    "memory": "2Gi",
                    "cpu": "1000m"
                }
            },
            "replicas": 1,
            "image": {
                "repository": "controlcore/cc-pap-pro-tenant",
                "tag": "latest",
                "pullPolicy": "IfNotPresent"
            },
            "env": {
                "TENANT_ID": tenant_id,
                "TENANT_NAME": company_name,
                "TIER": tier,
                "DATABASE_URL": f"postgresql://cc_{tenant_id[:8]}:{values['database']['password']}@postgres-{tenant_id[:8]}:5432/controlcore-{tenant_id[:8]}",
                "REDIS_URL": f"redis://redis-{tenant_id[:8]}:6379",
                "OPA_URL": f"http://opa-{tenant_id[:8]}:8181",
                "OPAL_URL": f"http://opal-{tenant_id[:8]}:7002"
            }
        }
        
        return values
    
    async def _deploy_with_helm(self, namespace: str, values: Dict[str, Any]) -> Dict[str, Any]:
        """Deploy tenant using Helm"""
        try:
            # Create temporary values file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
                yaml.dump(values, f)
                values_file = f.name
            
            try:
                # Helm install command
                cmd = [
                    "helm", "install",
                    f"tenant-{namespace}",
                    self.helm_chart_path,
                    "--namespace", namespace,
                    "--values", values_file,
                    "--wait",
                    "--timeout", "10m"
                ]
                
                if self.kubeconfig_path:
                    cmd.extend(["--kubeconfig", self.kubeconfig_path])
                
                result = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                stdout, stderr = await result.communicate()
                
                if result.returncode != 0:
                    raise Exception(f"Helm deployment failed: {stderr.decode()}")
                
                logger.info(f"Helm deployment successful for namespace {namespace}")
                
                return {
                    "success": True,
                    "release_name": f"tenant-{namespace}",
                    "namespace": namespace,
                    "output": stdout.decode()
                }
                
            finally:
                # Clean up temporary file
                os.unlink(values_file)
                
        except Exception as e:
            logger.error(f"Helm deployment failed for namespace {namespace}: {e}")
            raise
    
    async def _configure_dns(self, subdomain: str) -> Dict[str, Any]:
        """Configure DNS record for subdomain"""
        try:
            if self.dns_provider == "cloudflare":
                return await self._configure_cloudflare_dns(subdomain)
            elif self.dns_provider == "route53":
                return await self._configure_route53_dns(subdomain)
            else:
                logger.warning(f"DNS provider {self.dns_provider} not supported")
                return {"success": False, "error": "DNS provider not supported"}
                
        except Exception as e:
            logger.error(f"DNS configuration failed for {subdomain}: {e}")
            return {"success": False, "error": str(e)}
    
    async def _configure_cloudflare_dns(self, subdomain: str) -> Dict[str, Any]:
        """Configure Cloudflare DNS record"""
        try:
            headers = {
                "Authorization": f"Bearer {self.dns_api_key}",
                "Content-Type": "application/json"
            }
            
            # Get load balancer IP (this would need to be implemented based on your setup)
            lb_ip = await self._get_load_balancer_ip()
            
            data = {
                "type": "A",
                "name": subdomain,
                "content": lb_ip,
                "ttl": 300,
                "proxied": True  # Enable Cloudflare proxy
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"https://api.cloudflare.com/client/v4/zones/{self.dns_zone_id}/dns_records",
                    headers=headers,
                    json=data
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        if result.get("success"):
                            logger.info(f"DNS record created for {subdomain}")
                            return {"success": True, "record_id": result["result"]["id"]}
                        else:
                            raise Exception(f"Cloudflare API error: {result.get('errors', [])}")
                    else:
                        raise Exception(f"HTTP {response.status}: {await response.text()}")
                        
        except Exception as e:
            logger.error(f"Cloudflare DNS configuration failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _configure_route53_dns(self, subdomain: str) -> Dict[str, Any]:
        """Configure Route53 DNS record"""
        # Implementation would depend on AWS SDK
        # This is a placeholder
        logger.info(f"Route53 DNS configuration for {subdomain} (not implemented)")
        return {"success": False, "error": "Route53 not implemented"}
    
    async def _get_load_balancer_ip(self) -> str:
        """Get load balancer IP address"""
        # This would need to be implemented based on your Kubernetes setup
        # For now, return a placeholder
        return "1.2.3.4"  # Replace with actual LB IP
    
    async def _request_ssl_certificate(self, subdomain: str, namespace: str) -> Dict[str, Any]:
        """Request SSL certificate from Let's Encrypt"""
        try:
            # Create cert-manager Certificate resource
            certificate_manifest = {
                "apiVersion": "cert-manager.io/v1",
                "kind": "Certificate",
                "metadata": {
                    "name": f"{namespace}-tls",
                    "namespace": namespace
                },
                "spec": {
                    "secretName": f"{namespace}-tls",
                    "issuerRef": {
                        "name": "letsencrypt-prod" if not self.letsencrypt_staging else "letsencrypt-staging",
                        "kind": "ClusterIssuer"
                    },
                    "dnsNames": [subdomain]
                }
            }
            
            # Apply certificate manifest
            with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
                yaml.dump(certificate_manifest, f)
                cert_file = f.name
            
            try:
                cmd = ["kubectl", "apply", "-f", cert_file]
                if self.kubeconfig_path:
                    cmd.extend(["--kubeconfig", self.kubeconfig_path])
                
                result = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                stdout, stderr = await result.communicate()
                
                if result.returncode != 0:
                    raise Exception(f"Certificate creation failed: {stderr.decode()}")
                
                logger.info(f"SSL certificate requested for {subdomain}")
                return {"success": True, "certificate_name": f"{namespace}-tls"}
                
            finally:
                os.unlink(cert_file)
                
        except Exception as e:
            logger.error(f"SSL certificate request failed for {subdomain}: {e}")
            return {"success": False, "error": str(e)}
    
    async def _wait_for_deployment_ready(self, namespace: str, timeout: int = 300):
        """Wait for deployment to be ready"""
        try:
            cmd = ["kubectl", "wait", "--for=condition=available", "--timeout=300s", "deployment", "--all", "-n", namespace]
            if self.kubeconfig_path:
                cmd.extend(["--kubeconfig", self.kubeconfig_path])
            
            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await result.communicate()
            
            if result.returncode != 0:
                raise Exception(f"Deployment not ready: {stderr.decode()}")
            
            logger.info(f"Deployment ready in namespace {namespace}")
            
        except Exception as e:
            logger.error(f"Deployment readiness check failed: {e}")
            raise
    
    async def _initialize_tenant_data(self, tenant_id: str, namespace: str):
        """Initialize tenant data and configuration"""
        try:
            # This would involve calling the tenant initialization API
            # For now, just log the action
            logger.info(f"Initializing tenant data for {tenant_id} in namespace {namespace}")
            
            # In a real implementation, you would:
            # 1. Call the tenant initialization endpoint
            # 2. Create default policies
            # 3. Set up initial configuration
            # 4. Create admin user
            
        except Exception as e:
            logger.error(f"Tenant data initialization failed: {e}")
            raise
    
    async def _cleanup_failed_provisioning(self, tenant_id: str, namespace: str):
        """Clean up resources if provisioning fails"""
        try:
            logger.info(f"Cleaning up failed provisioning for tenant {tenant_id}")
            
            # Delete Helm release
            cmd = ["helm", "uninstall", f"tenant-{namespace}", "--namespace", namespace]
            if self.kubeconfig_path:
                cmd.extend(["--kubeconfig", self.kubeconfig_path])
            
            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            await result.communicate()
            
            # Delete namespace
            cmd = ["kubectl", "delete", "namespace", namespace]
            if self.kubeconfig_path:
                cmd.extend(["--kubeconfig", self.kubeconfig_path])
            
            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            await result.communicate()
            
            logger.info(f"Cleanup completed for tenant {tenant_id}")
            
        except Exception as e:
            logger.error(f"Cleanup failed for tenant {tenant_id}: {e}")
    
    def _generate_password(self) -> str:
        """Generate a secure password"""
        import secrets
        import string
        
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for _ in range(16))
        return password
