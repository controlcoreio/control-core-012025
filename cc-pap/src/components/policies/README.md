# Unified Policy Builder Flow

This document describes the unified policy creation implementation using a single modal for all scenarios.

## Flow Overview

The Unified Policy Builder provides a single, consistent modal interface for all policy creation needs.

### Scenario 1: New Policy Creation from Policies Page

**User Action**: Clicks "+ Create Control" button on the Policies page  
**Flow**:

1. `UnifiedPolicyBuilder` modal opens
2. **Smart Wizard Tab** is active by default
3. **Step 1**: User selects Resource and Bouncer (required)
4. **Steps 2-5**: Configure policy via wizard OR switch to Visual Builder/Code Editor
5. User can save as draft or deploy to sandbox
6. Modal closes and policy appears in list

**Edge Case**: If GitHub not connected, shows error banner with link to Settings

### Scenario 2: Editing Existing Policy

**User Action**: Clicks "Edit" on an existing policy  
**Flow**:

1. `UnifiedPolicyBuilder` modal opens with `mode="edit"`
2. Policy data pre-filled from database
3. User can modify via Visual Builder or Code Editor
4. Save updates the existing policy
5. Changes synced to GitHub

### Scenario 3: Template Deployment

**User Action**: Clicks "Deploy" on a template from Templates page  
**Flow**:

1. `UnifiedPolicyBuilder` modal opens with template data
2. Template data pre-loaded
3. User still must select Resource & Bouncer (Step 1)
4. Can deploy as-is or customize
5. Deploys to sandbox by default

### Scenario 4: Template Customization

**User Action**: Clicks "Customize" on a template  
**Flow**:

1. `UnifiedPolicyBuilder` modal opens with template data
2. Visual Builder or Code Editor tab active
3. User modifies template
4. Deploys customized version

### Scenario 5: Onboarding Wizard Policy Creation

**User Action**: User goes through Getting Started wizard  
**Flow**:

1. User reaches Policy Library step
2. User selects template or custom policy
3. `UnifiedPolicyBuilder` modal opens with `onboarding={true}`
4. Creates policy
5. Returns to onboarding wizard on completion

## Key Components

### UnifiedPolicyBuilder (`src/components/builder/UnifiedPolicyBuilder.tsx`)

The main modal component with 4 tabs:

1. **Smart Wizard** - Step-by-step guided creation
   - Step 1: Resource & Bouncer selection (required)
   - Step 2: Template selection (optional)
   - Steps 3-5: Configuration
   
2. **Visual Builder** - Drag-and-drop policy building
   - Visual condition builder
   - Effect selection
   - Real-time Rego generation
   
3. **Code Editor** - Full Rego code control
   - Monaco Editor with IntelliSense
   - Regal linting integration
   - Real-time validation
   
4. **Preview** - Policy summary and review
   - Visual representation
   - Rego code preview
   - Deployment options

**Props:**
- `mode`: 'create' | 'edit'
- `resourceId`: Optional pre-selected resource
- `policyId`: For edit mode
- `templateData`: Pre-loaded template data
- `open`: Modal visibility
- `onClose`: Close handler
- `onPolicyCreate`: Create callback
- `onPolicyUpdate`: Update callback
- `onboarding`: Onboarding mode flag

### SmartPolicyWizard (`src/components/builder/SmartPolicyWizard.tsx`)

Step-by-step wizard with:
- Resource & Bouncer selection (Step 1 - NEW)
- Template selection (Step 2)
- Access configuration (Steps 3-4)
- Review and deploy (Step 5)

### PolicyCodeEditor (`src/components/builder/PolicyCodeEditor.tsx`)

Professional code editor with:
- Monaco Editor integration
- Regal linting service
- Real-time validation
- Violation display panel

### PolicyVisualBuilder (`src/components/builder/PolicyVisualBuilder.tsx`)

Visual policy building interface:
- Condition builder
- Effect selector
- Rego code generation

### PolicyPreview (`src/components/builder/PolicyPreview.tsx`)

Policy summary and deployment:
- Visual summary
- Code preview
- Deployment options

## URL Patterns

**All policy creation now happens via modal - no URL navigation**

- Main policies page: `/policies`
- Templates page: `/policies/templates`
- Settings: `/settings/controls-repository` (GitHub config)
- Settings: `/settings/opal` (OPAL config)

## Data Flow

```
User Action (Create/Edit/Template)
         ↓
UnifiedPolicyBuilder Modal Opens
         ↓
Step 1: Select Resource & Bouncer
         ↓
Configure via Wizard/Visual/Code
         ↓
Validate with Regal (Code Editor)
         ↓
Save as Draft OR Deploy
         ↓
Store in Database
         ↓
Sync to GitHub
         ↓
Distribute via OPAL
         ↓
Enforce in Bouncer
```

## Key Features

1. **Single Modal**: All policy creation uses one consistent modal
2. **Resource Binding**: Every policy explicitly bound to resource + bouncer
3. **Draft Support**: Save work-in-progress to GitHub drafts/
4. **Multi-Method**: Switch between Wizard/Visual/Code anytime
5. **Real-Time Validation**: Regal linting as you type
6. **GitHub Integration**: All policies version controlled
7. **OPAL Distribution**: Real-time policy updates

## Benefits

- **Streamlined UX**: Consistent experience across all entry points
- **Professional Tools**: Monaco Editor + Regal = IDE-quality
- **Enterprise Ready**: Git-based, multi-environment, audited
- **Developer Friendly**: Clean code, real APIs, no mocks
- **Production Proven**: Error handling, validation, security

## Migration from Old System

**Old Flow:**
```
SelectResourceModal → Navigate to /policies/builder → PolicyBuilder component → Save
```

**New Flow:**
```
UnifiedPolicyBuilder modal → Select Resource+Bouncer → Configure → Save/Deploy
```

**Key Changes:**
- No more separate modals
- No more URL navigation
- No more AI marketing elements
- Resource + Bouncer selection is first step
- Draft support added
- GitHub integration required
- Regal validation integrated

## Configuration Requirements

Before users can create policies:

1. **GitHub Repository** must be configured in `/settings/controls-repository`
2. **Repository Structure** must exist:
   ```
   policies/
     drafts/
     sandbox/enabled/
     sandbox/disabled/
     production/enabled/
     production/disabled/
   ```
3. **Bouncers** must be deployed and registered
4. **Resources** must be added in Settings

---

**Last Updated:** October 15, 2025  
**Status:** Current - Reflects implemented system  
**Version:** 2.0 (Major refactor)
