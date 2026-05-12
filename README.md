# PR Review Bot

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
    types: [opened, synchronize]
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
    steps:
      - uses: actions/checkout@v4
      - uses: your-org/pr-review-bot@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

2. Create `.pr-review-bot.yml` in your repo root:

```yaml
llm:
  provider: claude
  model: claude-sonnet-4-6
```

3. Add your API key to GitHub Secrets.

## Configuration

See `.pr-review-bot.yml`:

| Key | Default | Description |
|-----|---------|-------------|
| `triggers.pr_open` | `true` | Auto-review on PR open/push |
| `triggers.slash_command` | `true` | Review on `/review` comment |
| `triggers.mention` | `true` | Review on `@bot-name` mention |
| `bot_name` | `pr-reviewer` | Bot username for @mention matching |
| `llm.provider` | `claude` | `claude`, `openai`, `deepseek`, `custom` |
| `llm.model` | `claude-sonnet-4-6` | Model name |
| `limits.max_files` | `20` | Max files to review per PR |
| `limits.max_lines_per_file` | `500` | Max lines per file diff |

## License

MIT
