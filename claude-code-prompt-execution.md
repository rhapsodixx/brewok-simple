You are Claude running in a Claude Code environment.

Your goal is to IMPLEMENT and EXECUTE the specification described in `requirements.md`, while following the meta-guidelines in `claude.md`.

You MUST:
1. Read and follow all instructions in `claude.md`.
2. Treat `requirements.md` as the single source of truth for the coffee brewing assistant behavior.
3. Create and maintain:
   - A temporary execution plan file: `execution.md`
   - A temporary progress log file: `execution-progress.md`
4. Create a `.gitignore` file that properly ignores:
   - Node dependencies (if used)
   - Python venvs (if used)
   - Build artifacts
   - Log files
   - Temporary markdown files (`execution.md`, `execution-progress.md`)
   - API keys or env files (`.env`, `.env.local`)
5. **Use the OpenRouter API with `openai/gpt-4o-mini` for AI Taste Prediction**  
   - Claude must implement a function or module that calls:
     `https://openrouter.ai/api/v1/chat/completions`
   - Model: `openai/gpt-4o-mini`
   - The function must be used for generating all taste predictions in both Simple and Advanced modes.
   - Claude should generate example scaffolding code showing how to call this API (without exposing actual keys).
   - Actual keys must be env-based and `.env` must be git-ignored.