# PatchFox

AI-driven code review bot for GitHub Actions. Reviews pull requests and posts line-level annotations via the GitHub Review API.

## Supported LLM Providers

- Claude (Anthropic)
- OpenAI (GPT-4, etc.)
- DeepSeek
- Custom (any OpenAI-compatible API)

## Setup

1. Create `.github/workflows/pr-review.yml`:

```yaml
name: PR Review
on:
  pull_request:
    types: [opened, synchronize, closed]
  issue_comment:
    types: [created]

# Dedup lock: only one review per PR at a time
concurrency:
  group: pr-review-${{ github.event.pull_request.number || github.event.issue.number }}
  cancel-in-progress: true

jobs:
  review:
    if: |
      github.event_name == 'pull_request' ||
      (github.event_name == 'issue_comment' &&
       github.event.issue.pull_request != null)
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: chenc/patchfox@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

2. Create `.patchfox.yml` in your repo root:

```yaml
llm:
  provider: claude
  model: claude-sonnet-4-6
  # Optional: control inference parameters
  # max_tokens: 8192
  # temperature: 0.3
  # thinking: true  # Claude extended thinking
```

3. Add your API key to GitHub Secrets.

## Configuration

See `.patchfox.yml`:

| Key | Default | Description |
|-----|---------|-------------|
| `triggers.pr_open` | `true` | Auto-review on PR open/push |
| `triggers.slash_command` | `true` | Review on `/review` comment |
| `triggers.mention` | `true` | Review on `@bot-name` mention |
| `triggers.pr_merged` | `true` | Update CONTEXT.md when a PR is merged |
| `bot_name` | `patchfox` | Bot username for @mention matching |
| `llm.provider` | `claude` | `claude`, `openai`, `deepseek`, `custom` |
| `llm.model` | `claude-sonnet-4-6` | Model name |
| `llm.max_tokens` | `4096` | Max output tokens |
| `llm.temperature` | — | Sampling temperature (0-2). Not set = SDK default |
| `llm.thinking` | — | Claude only. `true` → 1600 budget; number → custom budget. Enables extended thinking |
| `limits.max_files` | `20` | Max files to review per PR |
| `limits.max_lines_per_file` | `500` | Max lines per file diff |

## Commands

Comment on a PR to trigger actions:

| Command | Description |
|---------|-------------|
| `/review` | Trigger a code review of the PR |
| `/review generate-context` | Analyze the entire project and generate a `CONTEXT.md` file for better reviews |
| `@patchfox` | Mention the bot to trigger a review (if `triggers.mention` is enabled) |

### Project Context

On first run, if the repository doesn't have a `CONTEXT.md` file, the bot will comment on the PR asking if you'd like to generate one. Reply with `/review generate-context` and the bot will:

1. Scan the entire project structure
2. Read key configuration files
3. Generate a `CONTEXT.md` with project architecture, conventions, and guidelines
4. Post the result for you to review and commit

Subsequent reviews will automatically include `CONTEXT.md`, giving the LLM a "memory" of your project's architecture and standards.

### Merge Tracking

When a pull request is merged, PatchFox automatically:
1. Summarizes the merged PR's changes via the LLM
2. Appends a "Recent Changes" entry to `CONTEXT.md`
3. Commits and pushes the updated `CONTEXT.md` to the base branch
4. Posts a comment on the merged PR with the summary

To enable this, add `closed` to your workflow's `pull_request` types and ensure the `GITHUB_TOKEN` has `contents: write` permission. The `permissions` block in the Setup example above already includes this.

Disable via `.patchfox.yml`:
```yaml
triggers:
  pr_merged: false
```

If no `CONTEXT.md` exists when a PR merges, the bot will skip the update and suggest creating one.

## License

Proprietary. All rights reserved. Commercial use requires a paid license.
