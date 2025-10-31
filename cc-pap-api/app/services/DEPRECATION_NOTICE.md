# Service Deprecation and Migration Notice

## Deprecated Services

### github_service.py

**Status**: ⚠️ DEPRECATED - Scheduled for removal  
**Replacement**: `github_writer.py` and `github_validator.py`

**Reason for Deprecation**:
The `github_service.py` was designed for the old architecture where PAP pushed all policies to GitHub in bulk operations. The new architecture uses:
- Individual policy writes via `github_writer.py`
- Per-bouncer GitHub configuration
- OPAL-based policy distribution

**Current Usage** (to be migrated):
- `app/routers/settings.py` line ~518: Manual sync operation
- `app/routers/policies.py` line ~873: Draft policy creation
- `app/routers/policies.py` line ~952: Policy enable operation

**Migration Path**:

1. **Manual Sync** (`settings.py` line 518):
   - Should trigger OPAL sync via bouncer API instead of pushing policies
   - Update to use `BouncerSyncHistory` model
   - Call bouncer's OPAL sync endpoint

2. **Draft Policy Creation** (`policies.py` line 873):
   - Already has new implementation using `github_writer` in other endpoints
   - Migrate to use `get_github_writer_for_bouncer()`
   - Write policy file to bouncer-specific directory

3. **Policy Enable** (`policies.py` line 952):
   - Already has new implementation using `github_writer` in other endpoints
   - Migrate to use `get_github_writer_for_bouncer()`
   - Move policy from drafts to enabled directory

**Timeline**:
- **Phase 1** (Current): Deprecation notice added
- **Phase 2** (Next release): Add migration warnings in logs
- **Phase 3** (Release +1): Migrate all usage to new services
- **Phase 4** (Release +2): Remove `github_service.py`

**Migration Example**:

```python
# OLD (Deprecated)
from app.services.github_service import GitHubService
github_service = GitHubService(db)
github_service.save_policy_to_github(policy_id, rego_code, 'enabled', policy_name)

# NEW (Recommended)
from app.services.github_writer import get_github_writer_for_bouncer
writer = get_github_writer_for_bouncer(db, bouncer_id)
await writer.write_policy_file(resource_id, environment, policy_id, rego_code, policy_name)
```

## Service Comparison

### Old Architecture (github_service.py)
```
PAP → GitHub Repository → OPAL Server → Bouncer
     (bulk sync)    (centralized)    (client)
```

### New Architecture (github_writer.py)
```
PAP → GitHub Repository ← Bouncer (OPAL built-in)
     (per-policy)        (direct pull)
```

## References

- Architecture Documentation: `/00_START_HERE.md`
- Implementation Guide: `/README_IMPLEMENTATION.md`
- GitHub Architecture: `/CORRECT_GITHUB_OPAL_ARCHITECTURE.md`

---

**Last Updated**: 2025-10-31

