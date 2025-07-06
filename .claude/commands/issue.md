Please analyze and fix the GitHub issue: $ARGUMENTS.

**IMPORTANT: Use ULTRATHINK throughout the entire process - deeply analyze, consider all implications, and think through edge cases before taking any action.**

Follow these steps:
1. Use 'gh issue view' to get the issue details.
2. Understand the problem described in the issue.
3. Search the codebase for relevant files and understand the current implementation.
4. Implement the necessary changes to fix the issue.
5. Run tests to ensure no regressions are introduced.
6. Create a descriptive commit message that includes "Closes #[issue_number]" to automatically close the issue.
7. Commit the changes (Left Hook will automatically run linting and type checking).
8. Push the changes.

**Guidelines:**
- Use the GitHub CLI ('gh') for all Github-related tasks.
- Always run the appropriate test suite after making changes.
- If you encounter technical blockers during analysis or implementation, or need guidance on architectural decisions, consult the O3 MCP tool for expert assistance.
- Follow the project's coding conventions and patterns found in existing code.