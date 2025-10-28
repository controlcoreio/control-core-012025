# Control Core Deployment Checklist

Use this checklist to ensure successful deployment of Control Core with auto-discovery.

## Pre-Deployment

### System Requirements
- [ ] Docker 20.10.0+ installed
- [ ] Docker Compose 2.0.0+ installed
- [ ] 4GB+ RAM available (Kickstart/Custom) or 2GB+ (Pro)
- [ ] 20GB+ disk space available
- [ ] Ports available: 3000, 8080, 8082, 7000, 5432

### Prerequisites
- [ ] Control Core account created
- [ ] Subscription tier selected (Kickstart, Pro, Custom)
- [ ] Deployment package downloaded
- [ ] Package extracted to deployment directory

---

## Control Plane Deployment

### Kickstart/Custom Tier

- [ ] Review `controlcore-compose.yml`
- [ ] Update `.env` file with:
  - [ ] `TENANT_ID` - Your tenant ID
  - [ ] `API_KEY` - Your API key
  - [ ] `CC_BUILTIN_ADMIN_PASS` - Admin password
  - [ ] `DATABASE_PASSWORD` - Database password
- [ ] Run migration: `python cc-pap-api/migrations/add_auto_discovery_fields.py`
- [ ] Deploy: `docker-compose -f controlcore-compose.yml up -d`
- [ ] Wait 30-60 seconds for services to start
- [ ] Verify health: `curl http://localhost:8082/api/v1/health`
- [ ] Access UI: http://localhost:3000
- [ ] Log in with admin credentials

### Pro Tier

- [ ] Control Plane is hosted (skip deployment)
- [ ] Note your hosted URL: `https://controlcore-pro-xxxxxxxx.controlcore.io`
- [ ] Have your API key ready
- [ ] Verify hosted Control Plane is accessible

---

## Bouncer Deployment (Auto-Discovery)

### Step 1: Configure Resource Information

- [ ] Decide what to protect (API, webapp, database, etc.)
- [ ] Gather resource information:
  - [ ] Resource name
  - [ ] Resource type
  - [ ] Internal host:port
  - [ ] Original public URL (if any)
  - [ ] Desired security posture

### Step 2: Create Bouncer Configuration

Use template from `templates/bouncer-example-compose.yml`:

- [ ] Copy template
- [ ] Update `RESOURCE_NAME`
- [ ] Update `RESOURCE_TYPE`
- [ ] Update `TARGET_HOST`
- [ ] Update `ORIGINAL_HOST_URL`
- [ ] Set `BOUNCER_ID` (unique per bouncer)
- [ ] Set `SECURITY_POSTURE` (deny-all recommended)
- [ ] Set `PAP_API_URL` to your Control Plane URL
- [ ] Set `TENANT_ID` and `API_KEY`

### Step 3: Deploy Bouncer

- [ ] Deploy: `docker-compose -f your-bouncer-compose.yml up -d`
- [ ] Wait 10-20 seconds for bouncer to start
- [ ] Check logs: `docker logs <bouncer-name> | grep "Successfully registered"`
- [ ] Verify health: `curl http://localhost:8080/health`

### Step 4: Verify Auto-Discovery

- [ ] Check resource in API: `curl http://localhost:8082/api/v1/resources | jq`
- [ ] Verify `auto_discovered: true`
- [ ] Verify `bouncer_id` is set
- [ ] Check in UI: Navigate to `/settings/resources`
- [ ] Verify resource appears with bouncer linkage

---

## Resource Enrichment

### Via API (Available Now)

- [ ] Get auth token
- [ ] Call enrichment endpoint:
  ```bash
  curl -X PUT http://localhost:8082/api/v1/resources/{id}/enrich \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d '{
      "business_context": "Description",
      "data_classification": "confidential",
      "compliance_tags": ["GDPR", "SOC2"],
      "owner_email": "owner@company.com",
      "sla_tier": "gold"
    }'
  ```
- [ ] Verify enrichment saved

### Via UI (Pending Implementation)

- [ ] Navigate to `/settings/resources`
- [ ] Click on auto-discovered resource
- [ ] Click "Enrich Resource"
- [ ] Fill in enrichment fields
- [ ] Save

---

## Policy Configuration

- [ ] Navigate to `/policies` in Control Plane UI
- [ ] Create policy for your resource
- [ ] Test policy in sandbox environment
- [ ] Deploy policy to production
- [ ] Verify policy enforcement via bouncer

---

## Testing

### Basic Tests

- [ ] Test bouncer health: `curl http://localhost:8080/health`
- [ ] Test Control Plane health: `curl http://localhost:8082/api/v1/health`
- [ ] Test policy evaluation through bouncer
- [ ] Check audit logs for access decisions

### Auto-Discovery Tests

- [ ] Deploy second bouncer with different resource
- [ ] Verify both resources auto-discovered
- [ ] Verify no duplicates
- [ ] Restart bouncer, verify no duplicate registration
- [ ] Update bouncer config, redeploy, verify update

---

## Troubleshooting

### Bouncer Won't Register

- [ ] Check Control Plane is running
- [ ] Verify `PAP_API_URL` is correct
- [ ] Verify `API_KEY` is valid
- [ ] Check bouncer logs for errors
- [ ] Verify network connectivity

### Resource Not Appearing

- [ ] Check bouncer logs for "Successfully registered"
- [ ] Check Control Plane logs for registration errors
- [ ] Verify `RESOURCE_NAME` and `RESOURCE_TYPE` are set
- [ ] Check database for resource: `SELECT * FROM protected_resources`

### Enrichment Not Saving

- [ ] Verify auth token is valid
- [ ] Check API endpoint URL
- [ ] Check request body format
- [ ] Check Control Plane logs for errors

---

## Post-Deployment

### Monitoring Setup

- [ ] Set up log aggregation
- [ ] Configure health check alerts
- [ ] Monitor bouncer heartbeats
- [ ] Monitor policy evaluation performance

### Security Hardening

- [ ] Change default admin password
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up VPN access (if needed)
- [ ] Rotate API keys regularly

### Backup Configuration

- [ ] Set up database backups
- [ ] Backup configuration files
- [ ] Document disaster recovery procedure
- [ ] Test restoration process

---

## Deployment Success Criteria

You have successfully deployed Control Core when:

- ✅ Control Plane UI accessible at http://localhost:3000
- ✅ Admin login works
- ✅ At least one bouncer deployed and showing "active"
- ✅ At least one resource auto-discovered
- ✅ Resource shows bouncer linkage
- ✅ Policy created and deployed
- ✅ Test request through bouncer returns policy decision
- ✅ Audit logs capturing access decisions

---

## Support Contacts

### Documentation
- Quick Start: `/AUTO_DISCOVERY_QUICKSTART.md`
- Full Guide: `/cc-infra/docs/AUTO_DISCOVERY.md`
- Troubleshooting: Deployment guide troubleshooting section

### Help
- Email: support@controlcore.io
- Documentation: https://docs.controlcore.io
- Community: GitHub Discussions

---

## Completion

- [ ] All services deployed successfully
- [ ] All health checks passing
- [ ] Resources auto-discovered
- [ ] Policies configured
- [ ] Testing complete
- [ ] Monitoring configured
- [ ] Backups configured
- [ ] Documentation reviewed
- [ ] Team trained

**Deployment Complete!** 🎉

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Environment**: ☐ Dev ☐ Staging ☐ Production  
**Tier**: ☐ Kickstart ☐ Pro ☐ Custom

