# Branch Protection Configuration

## Main Branch Protection Rules

### Required Settings
- **Require pull request reviews before merging**: ✅
  - Required number of reviewers: 2
  - Dismiss stale reviews when new commits are pushed: ✅
  - Require review from code owners: ✅

- **Require status checks to pass before merging**: ✅
  - Require branches to be up to date before merging: ✅
  - Required status checks:
    - `lint` - Lint and Format Check
    - `test` - Unit Tests
    - `security` - Security Scan
    - `build` - Build Docker Images
    - `integration` - Integration Tests

- **Require conversation resolution before merging**: ✅

- **Require signed commits**: ✅

- **Require linear history**: ✅

- **Include administrators**: ✅

- **Restrict pushes that create files**: ✅

### Branch Protection for Developer Branches

#### Rakesh Branch (rakesh)
- **Allow force pushes**: ✅ (for rebasing)
- **Allow deletions**: ✅
- **Require status checks**: ✅
  - `lint`
  - `test`
  - `build`

#### Other Developer Branches
- **Allow force pushes**: ✅ (for rebasing)
- **Allow deletions**: ✅
- **Require status checks**: ✅
  - `lint`
  - `test`

## Code Review Guidelines

### Review Requirements
1. **Minimum Reviewers**: 2 for main branch, 1 for developer branches
2. **Review Timeline**: Within 24 hours
3. **Approval Required**: All reviewers must approve
4. **Code Owner Review**: Required for changes to core components

### Review Checklist
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Backward compatibility maintained

## Automated Checks

### Pre-merge Checks
- Code linting and formatting
- Unit test coverage (>80%)
- Security vulnerability scan
- Docker image build
- Integration tests

### Post-merge Actions
- Automatic deployment to staging
- Documentation generation
- Release notes creation
- Performance monitoring

## Emergency Procedures

### Hotfix Process
1. Create hotfix branch from main
2. Make minimal changes
3. Fast-track review (1 reviewer)
4. Merge to main
5. Cherry-pick to development branches

### Rollback Process
1. Identify problematic commit
2. Create revert PR
3. Fast-track review
4. Deploy rollback
5. Investigate root cause

## Branch Naming Conventions

### Branch Types
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical fixes
- `release/version` - Release preparation
- `chore/description` - Maintenance tasks

### Examples
- `feature/policy-templates`
- `bugfix/caching-issue`
- `hotfix/security-patch`
- `release/v1.0.0`
- `chore/update-dependencies`

## Merge Strategies

### For Main Branch
- **Merge commit**: For feature branches
- **Squash and merge**: For single-commit changes
- **Rebase and merge**: For clean history (admin only)

### For Developer Branches
- **Merge commit**: Default strategy
- **Squash and merge**: For cleanup
- **Rebase and merge**: For linear history

## Conflict Resolution

### Merge Conflicts
1. **Identify**: Check PR status for conflicts
2. **Resolve**: Update branch with latest main
3. **Test**: Ensure all checks pass
4. **Review**: Request re-review if significant changes

### Rebase Conflicts
1. **Abort**: `git rebase --abort` if needed
2. **Resolve**: Fix conflicts manually
3. **Continue**: `git rebase --continue`
4. **Force Push**: `git push --force-with-lease`

## Monitoring and Alerts

### Branch Health Metrics
- **Build Success Rate**: >95%
- **Review Time**: <24 hours
- **Merge Frequency**: Daily
- **Conflict Rate**: <5%

### Alert Conditions
- Build failures
- Security vulnerabilities
- Performance regressions
- Review delays >48 hours

## Team Responsibilities

### Principal Developer (Rakesh)
- Maintain rakesh branch
- Review critical changes
- Merge to main after approval
- Handle emergency situations

### Other Developers
- Maintain individual branches
- Review peer changes
- Follow coding standards
- Update documentation

### Code Owners
- Review changes to core components
- Approve architectural changes
- Maintain code quality standards
- Mentor junior developers

---

**Configuration Status**: Ready for Implementation  
**Last Updated**: September 2025  
**Next Review**: October 2025
