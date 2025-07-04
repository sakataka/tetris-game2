# discuss-with-gemini

Use Gemini CLI to conduct in-depth discussions about current work, enhancing Claude Code's accuracy through multi-perspective analysis and iterative refinement.

## Prerequisites
Before using this command, ensure:
- Gemini CLI is installed (`gemini` command available)
- Authenticated via `gcloud auth application-default login`

## Execution Steps

1. **Gather Current Context**
   First, I'll collect information about your current work:
   ```bash
   # Check Git status and recent changes
   git status --porcelain
   git diff --cached
   git diff
   git log --oneline -10
   ```

2. **Prepare Discussion Topics**
   Based on the context, I'll prepare discussion points covering:
   - Architecture and design patterns
   - Performance and scalability
   - Maintainability and code quality
   - Security considerations
   - Best practices alignment

3. **Initiate Gemini Discussion**
   I'll create a comprehensive prompt and start the discussion:
   ```bash
   # Create temporary file with context and questions
   echo "[Gathered context and discussion topics]" > .claude/temp_gemini_discussion_$(date +%Y%m%d_%H%M%S).md
   
   # Start batch discussion with Gemini using --prompt flag
   cat .claude/temp_gemini_discussion_*.md | gemini --prompt "Analyze the provided context and discuss the topics. Provide your insights and recommendations. 最終的な出力は日本語でお願いします。"
   ```

4. **Iterative Refinement**
   I'll conduct 3-5 rounds of automated discussion in Japanese:
   - Round 1: Initial analysis and recommendations
   - Round 2: Deep dive into critical areas
   - Round 3: Implementation specifics and code examples
   - Round 4: Risk assessment and mitigation strategies
   - Round 5: Final synthesis and prioritization
   
   Each round will automatically build upon the previous responses and all content will be preserved in the log.

5. **Generate Action Plan**
   After all discussion rounds, I'll synthesize an actionable plan in Japanese:
   - Immediate implementation items (High priority)
   - Short-term improvements (Medium priority)
   - Long-term considerations (Low priority)
   - Implementation guidelines and anti-patterns to avoid
   - Detailed summary of all discussion points and recommendations

6. **Save Discussion Log**
   The complete discussion will be saved for future reference:
   ```bash
   # Create discussion log directory if needed
   mkdir -p .claude/discussion_logs
   
   # Save timestamped log with all rounds and detailed discussion content
   echo "[Complete discussion content from all rounds]" > .claude/discussion_logs/gemini_discussion_$(date +%Y%m%d_%H%M%S).md
   
   # Each round's output will be appended to preserve the complete conversation
   echo "=== ROUND 1: Initial Analysis and Recommendations ===" >> .claude/discussion_logs/gemini_discussion_$(date +%Y%m%d_%H%M%S).md
   [Round 1 Gemini output] >> .claude/discussion_logs/gemini_discussion_$(date +%Y%m%d_%H%M%S).md
   
   echo "=== ROUND 2: Deep Dive into Critical Areas ===" >> .claude/discussion_logs/gemini_discussion_$(date +%Y%m%d_%H%M%S).md
   [Round 2 Gemini output] >> .claude/discussion_logs/gemini_discussion_$(date +%Y%m%d_%H%M%S).md
   
   # Continue for all rounds...
   
   # Generate comprehensive summary at the end
   echo "=== FINAL SUMMARY ===" >> .claude/discussion_logs/gemini_discussion_$(date +%Y%m%d_%H%M%S).md
   
   # Clean up temporary files
   rm -f .claude/temp_gemini_discussion_*.md
   ```

## Usage Examples

### Basic Discussion
```
/discuss-with-gemini
```
Analyzes current Git changes and work context

### Specific Topic Discussion
```
/discuss-with-gemini GraphQL schema optimization
```
Focuses discussion on a particular area

### File-Specific Analysis
```
/discuss-with-gemini Review the implementation in backend/apps/cotomu/domain/usecases/file_operations.go
```
Analyzes a specific file with Gemini's insights

### Deep Analysis Mode
```
/discuss-with-gemini --deep Performance optimization for large file uploads
```
Conducts 5 rounds of discussion instead of the default 3

## Additional Instructions
$ARGUMENTS

## Expected Outcomes
- Deeper understanding of code quality issues
- Concrete improvement suggestions with examples
- Prioritized action items for implementation
- Documentation of architectural decisions
- Early detection of potential problems

## Notes
- The discussion will be conducted entirely in Japanese for better understanding and communication
- Each discussion round builds upon previous insights in an automated batch process
- All intermediate discussion content is preserved in the log file for complete traceability
- The final action plan will include specific code examples where applicable
- All discussions are logged for future reference and decision tracking
- Both detailed round-by-round discussions and comprehensive summaries are saved
