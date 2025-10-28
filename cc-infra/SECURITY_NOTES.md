# Security Implementation Notes

## Authentication System

Control Core implements a secure authentication system with the following features:

### System Administrator Account

- A builtin system administrator account is created during database initialization
- Credentials **MUST** be provided via environment variables
- This account bypasses all RBAC checks for emergency access
- All actions are audited with special markers

### Environment Variables Required

Before initializing the database, set these environment variables:

```bash
export CC_BUILTIN_ADMIN_USER='your_chosen_username'
export CC_BUILTIN_ADMIN_PASS='your_secure_password'
```

Or add them to your `.env` file:

```
CC_BUILTIN_ADMIN_USER=your_chosen_username
CC_BUILTIN_ADMIN_PASS=your_secure_password
```

### Security Best Practices

1. **Never commit credentials** to version control
2. **Use strong passwords** for the system administrator account
3. **Rotate credentials regularly** (every 90 days minimum)
4. **Limit access** to the system administrator account
5. **Monitor usage** through audit logs
6. **Use customer IDPs** (Auth0, SAML) for regular administrative users

### Customer Deployments

For customer deployments:
- Integrate with customer's Identity Provider (Auth0, SAML SSO, etc.)
- Create customer admin users through their IDP
- Customer admins will have full organizational privileges
- System administrator account should only be used for emergency access

## Audit Logging

All system administrator actions are logged with:
- Special policy name: `SYSTEM_ADMIN_BYPASS`
- Reason: "System administrator - bypasses all RBAC checks"
- Standard audit fields (user, action, resource, timestamp, etc.)

## Password Management

- All passwords are hashed using bcrypt
- Hash scheme: `bcrypt` with `auto` deprecation
- Passwords are never stored in plain text
- Database only stores password hashes

## RBAC Bypass Logic

The system administrator account bypasses RBAC through:
1. Role check: `user.role == "builtin_admin"`
2. Automatic `PERMIT` decision for all authorization requests
3. No policy evaluation performed
4. Special audit log markers

This ensures emergency access while maintaining complete audit trails.

---

**Important**: Keep this document internal. Do not share with customers or include in customer-facing documentation.

