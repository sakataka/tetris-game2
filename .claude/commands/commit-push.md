---
allowed-tools: Bash
description: Complete development workflow - validate, commit, and push changes
---

# Development Workflow: Commit & Push

This command executes a comprehensive development workflow that ensures code quality before committing and pushing changes:

1. **Quality Assurance Checks** - Execute type checking and test suites
2. **Git Status Review** - Display current repository state and changes
3. **Commit Creation** - Generate appropriate commit message based on changes
4. **GitHub Push** - Synchronize changes with remote repository

## Execution Flow

### Step 1: Quality Assurance Validation
Verify that all code meets project quality standards:

```bash
# Execute only typecheck and tests (format/lint handled automatically by lefthook)
bun run typecheck && bun test
```

### Step 2: Git Status Analysis
Display current repository state to identify all pending changes:

```bash
git status
git diff --stat
```

### Step 3: Detailed Change Analysis
Review specific changes in each modified file to inform commit message generation:

```bash
git diff
```

### Step 4: Commit Creation and Push
After quality checks pass, proceed with commit and push:

1. **Generate Appropriate Commit Message**:
   - Identify change type (feat, fix, refactor, docs, etc.)
   - Write concise summary of changes
   - Add detailed description if necessary

2. **Execute Commit and Push**:
   ```bash
   git add -A
   git commit -m "generated commit message following conventional commits"
   git push
   ```

## Important Notes

- If quality checks fail, fix issues before re-executing the workflow
- Follow [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages
- **Lefthook Integration**: Format and lint checks run automatically during commit via git hooks
- Verify remote branch state before pushing to avoid merge conflicts

Ready to begin? Start with quality assurance checks.