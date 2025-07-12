---
allowed-tools: Bash, Read, Edit, MultiEdit
description: Comprehensive i18n consistency check with dynamic pattern detection and hardcoded string analysis
---

# i18n Consistency Check & Cleanup

Comprehensive i18n analysis tool that detects missing keys, unused translations, dynamic patterns, and hardcoded strings requiring localization.

## Execution Overview

### 1. i18n Consistency Check
```bash
bun run check:i18n
```

This comprehensive check detects:
- **Missing Keys**: Keys used in code but not present in translation files
- **Unused Keys**: Keys present in translation files but not used in code
- **Dynamic Patterns**: Template literal patterns like `t(\`game.${type}\`)`
- **Hardcoded Strings**: Text that should use i18n translation system
- **Potential Issues**: Runtime translation errors and i18n compliance violations

### 2. Advanced Problem Detection

#### Missing Keys 🔴 Critical
- **Priority**: Critical (causes runtime errors)
- **Impact**: Displays raw translation keys to users
- **Action**: Add missing keys to translation files immediately

#### Dynamic Key Patterns 🔄 Analysis Required
- **Detection**: `t(\`template.${variable}\`)` patterns
- **Analysis**: Validates all possible key combinations exist
- **Action**: Verify all generated keys are defined in translation files

#### Hardcoded Strings 📝 i18n Compliance
- **Detection**: User-facing strings not using t() function
- **Examples**: "AI Replay", "Start AI", "Loading..." etc.
- **Action**: Convert to translation keys for proper localization

#### Unused Keys ⚠️ Optimization
- **Priority**: Medium (cleanup opportunity)
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