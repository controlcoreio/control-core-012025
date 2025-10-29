# Template Prefilling Debug Guide

## Issue Description
When clicking "Copy Control" on a policy template, the Policy Builder opens but:
1. Control Name and Description fields are empty (not prefilled from template)
2. Code Editor shows generic Rego code instead of template content

## Debugging Added

### Console Logs Added
I've added debugging console logs to track the data flow:

1. **UnifiedPolicyBuilder.tsx** (lines 195-196):
   ```typescript
   console.log('[UnifiedPolicyBuilder] Setting policyData to:', newPolicyData);
   console.log('[UnifiedPolicyBuilder] Template data was:', templateData);
   ```

2. **IntelligentPolicyBuilder.tsx** (line 122):
   ```typescript
   console.log('[IntelligentPolicyBuilder] Syncing from policyData:', policyData);
   ```

3. **PolicyCodeEditor.tsx** (lines 72-75):
   ```typescript
   console.log('[PolicyCodeEditor] policyData.regoCode changed:', policyData.regoCode);
   console.log('[PolicyCodeEditor] current code:', code);
   if (policyData.regoCode && policyData.regoCode !== code) {
     console.log('[PolicyCodeEditor] Updating code from template');
   ```

## Testing Steps

### 1. Open Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Clear the console

### 2. Test Template Copy
1. Navigate to: http://localhost:3000/policies/templates
2. Click "Copy Control" on any template
3. Watch the console logs

### 3. Expected Console Output
You should see logs like:
```
[UnifiedPolicyBuilder] Loading template data: {name: "...", description: "...", template_content: "..."}
[UnifiedPolicyBuilder] Setting policyData to: {name: "...", description: "...", regoCode: "..."}
[IntelligentPolicyBuilder] Syncing from policyData: {name: "...", description: "...", regoCode: "..."}
[PolicyCodeEditor] policyData.regoCode changed: "..."
[PolicyCodeEditor] Updating code from template
```

### 4. Check Visual Builder Tab
1. In Policy Builder, go to "Visual Builder" tab
2. Check if:
   - Control Name field is filled
   - Description field is filled
   - Effect dropdown shows correct value

### 5. Check Code Editor Tab
1. In Policy Builder, go to "Code Editor" tab
2. Check if:
   - Editor shows template content (not generic Rego)
   - Content matches the template's template_content

## Troubleshooting

### If No Console Logs Appear
- Template data might not be passed correctly
- Check if templateData is null/undefined

### If UnifiedPolicyBuilder Logs But IntelligentPolicyBuilder Doesn't
- State sync issue in IntelligentPolicyBuilder
- policyData object reference not changing

### If IntelligentPolicyBuilder Logs But Fields Are Empty
- Form state not updating properly
- Check if setPolicyName, setPolicyDescription are working

### If Code Editor Shows Generic Code
- regoCode not being set correctly
- PolicyCodeEditor useEffect not triggering

## Quick Fixes to Try

### 1. Force State Update
If the issue is React not detecting object changes, try:
```typescript
// In UnifiedPolicyBuilder.tsx, after setting policyData
setPolicyData({...newPolicyData}); // Force new object reference
```

### 2. Add Key Prop
If components aren't re-rendering, add a key prop:
```typescript
<IntelligentPolicyBuilder
  key={policyData.name} // Force re-render when name changes
  policyData={policyData}
  setPolicyData={setPolicyData}
  onNext={() => setActiveTab('preview')}
/>
```

### 3. Check Template Data Structure
Verify the template data has the expected structure:
```typescript
console.log('Template structure:', {
  name: templateData.name,
  description: templateData.description,
  template_content: templateData.template_content,
  metadata: templateData.metadata
});
```

## Current Status
- ✅ Debugging logs added
- ✅ Template data loading logic updated
- ✅ State sync logic simplified
- ⏳ Ready for testing with console logs

## Next Steps
1. Test with console logs to identify where the data flow breaks
2. Apply appropriate fix based on console output
3. Remove debug logs once fixed
4. Verify both Visual Builder and Code Editor work correctly

---
**Debugging Added**: January 29, 2025  
**Status**: Ready for Testing with Console Logs
