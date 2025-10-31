# Archived Legacy Components

This directory contains legacy Control Core components that have been deprecated and superseded by modern implementations. These are kept for reference purposes only and should not be used in new deployments.

## Legacy Components

### legacy-pap-admin-server
**Status**: ⚠️ DEPRECATED  
**Superseded by**: `cc-pap-api` (FastAPI-based Policy Administration Point API)  
**Original Purpose**: Legacy fine-grained policy agent server based on OPAL server  
**Reason for Deprecation**: Replaced with modern FastAPI backend with better performance, security, and features

### legacy-pap-client
**Status**: ⚠️ DEPRECATED  
**Superseded by**: `cc-pap` (React 18 + Vite frontend)  
**Original Purpose**: Legacy Policy Administration Point frontend  
**Reason for Deprecation**: Replaced with modern React frontend with shadcn/ui, TypeScript, and improved UX

### legacy-pdp
**Status**: ⚠️ DEPRECATED  
**Superseded by**: `cc-bouncer` (Integrated PEP + PDP)  
**Original Purpose**: Standalone Policy Decision Point service  
**Reason for Deprecation**: Functionality integrated into cc-bouncer for better performance and reduced complexity

## Migration Guide

If you're currently using any of these legacy components:

1. **From legacy-pap-admin-server**: Migrate to `cc-pap-api`
   - Modern FastAPI backend with SQLAlchemy ORM
   - Enhanced security with JWT authentication
   - 180+ policy templates
   - PIP connector service

2. **From legacy-pap-client**: Migrate to `cc-pap`
   - Modern React 18 frontend
   - Improved UI/UX with shadcn/ui components
   - Policy builder with templates
   - Real-time policy monitoring

3. **From legacy-pdp**: Migrate to `cc-bouncer`
   - Integrated PEP (Policy Enforcement Point) + PDP
   - Sub-100ms policy evaluation with caching
   - OPAL integration for real-time policy sync
   - Content injection for AI agents

## Support

These legacy components are no longer maintained or supported. For assistance with migration to modern components, please refer to:

- Main documentation: `/README.md`
- Getting started: `/00_START_HERE.md`
- Component documentation in respective directories

---

**Archived**: 2025-10-31  
**Last Updated**: 2025-10-31

