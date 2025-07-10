---
allowed-tools: Bash, Read, Edit, MultiEdit
description: Check i18n consistency and help clean up unused translation keys
---

# i18n Consistency Check & Cleanup

Verify translation key consistency and assist with removing unused translation keys to optimize localization files.

## Execution Overview

### 1. i18n Consistency Check
```bash
bun run check:i18n
```

This check detects:
- **Missing Keys**: Keys used in code but not present in translation files
- **Unused Keys**: Keys present in translation files but not used in code

### 2. Result Analysis

#### Missing Keys
- **Priority**: 🔴 High (causes build errors)
- **Action**: Add missing keys to translation files

#### Unused Keys
- **Priority**: 🟡 Medium (warnings only)
- **Action**: Remove unnecessary translation keys to optimize file size

### 3. Automated Cleanup

When unused keys are detected, they can be safely removed from:
- `src/locales/en.json`
- `src/locales/ja.json`

Identify target keys for removal and consistently delete from both language files.

## Usage

```
/project:i18n-cleanup
```

## Workflow

1. **Execute Check**: Run initial consistency check
2. **Identify Issues**: List Missing/Unused keys
3. **Propose Fixes**: Present specific correction methods
4. **Confirm Execution**: Ask user to approve modifications
5. **Apply Fixes**: Update translation files after approval
6. **Verify**: Re-run check after modifications

## Safety Measures

- Re-verify usage before key deletion
- Execute consistent operations across both language files
- Validate JSON syntax after deletion
- Confirm no issues with tests and build

Let's begin by checking the current status.