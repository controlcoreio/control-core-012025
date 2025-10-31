# Archived Frontend Components

This directory contains deprecated Control Core frontend components that have been superseded by new implementations following the correct distributed architecture.

## Deprecated Components

### 1. PolicyRepositorySettings.tsx

**Status**: ⚠️ DEPRECATED  
**Superseded by**: `BouncerGitHubTab.tsx` in `/cc-pap/src/components/settings/pep/`  
**Archived**: 2025-10-31

**Reason for Deprecation**:
This component implemented centralized GitHub repository configuration at the tenant level. The new architecture implements per-bouncer GitHub configuration, which aligns with the distributed OPAL model where each bouncer manages its own policy sync.

**Old Architecture**:
```
Tenant-Level GitHub Config
     ↓
All Bouncers use same repo/branch
     ↓
Centralized sync from PAP
```

**New Architecture**:
```
Per-Bouncer GitHub Config
     ↓
Each bouncer has its own:
  - GitHub repository
  - Branch
  - Policy path
     ↓
Decentralized OPAL sync (built into each bouncer)
```

**Route Removed**: `/settings/controls-repository`  
**Replacement Route**: GitHub config now in `/settings/peps` (per-bouncer configuration)

**Key Differences**:
1. **Configuration Level**: Tenant-wide → Per-bouncer
2. **Sync Model**: PAP pushes → Bouncer pulls
3. **OPAL Integration**: Centralized server → Built into each bouncer
4. **Policy Organization**: Flat structure → Hierarchical (bouncer/environment/policy)

**Migration Guide**:
If you were using the old Controls Repository settings:

1. Navigate to **Settings → PEP Management**
2. Click on a bouncer to view details
3. Go to the **GitHub** tab
4. Configure GitHub repository for that specific bouncer
5. Repeat for each bouncer as needed

**Benefits of New Approach**:
- Different bouncers can use different policy repositories
- Better isolation and security
- Aligns with official OPAL architecture
- Supports multi-environment deployments
- Reduces complexity in Control Plane

### 2. UnifiedPolicyCreationModal.tsx

**Status**: ⚠️ DEPRECATED  
**Superseded by**: `UnifiedPolicyBuilder.tsx` in `/cc-pap/src/components/builder/`  
**Archived**: 2025-10-31

**Reason for Deprecation**:
This component was an early implementation of the policy creation modal. It has been superseded by the more comprehensive `UnifiedPolicyBuilder` component which provides:
- Better UX with step-by-step wizard
- Template selection
- Visual policy builder
- Code editor with syntax highlighting
- Policy preview and testing

**Usage**: 
This component was never fully integrated and remained in development. It includes a console.error warning indicating it should not be used.

**Replacement**: 
Use `UnifiedPolicyBuilder` component from `/cc-pap/src/components/builder/UnifiedPolicyBuilder.tsx`

## Related Documentation

- Architecture: `/CORRECT_GITHUB_OPAL_ARCHITECTURE.md`
- Implementation: `/00_START_HERE.md`
- UX Design: `/GITHUB_CONTROLS_UX_DESIGN.md`

---

**Last Updated**: 2025-10-31

