import { ReviewInput } from '../types';

export function buildPrompt(input: ReviewInput): string {
  const fileList = input.files
    .map((f) => `- ${f.filename} (+${f.additions} -${f.deletions})`)
    .join('\n');

  return `You are a code reviewer. Review the following PR diff and provide actionable feedback.

PR Title: ${input.pr.title}
PR Description: ${input.pr.description}

Changed files:
${fileList || '(none)'}

Diff:
\`\`\`diff
${input.diff}
\`\`\`

Provide your review as a JSON object with this exact structure:
{
  "summary": "overall assessment of the PR (1-3 sentences)",
  "comments": [
    {
      "file": "path/to/file.ts",
      "line": 42,
      "body": "specific, actionable feedback",
      "severity": "info"
    }
  ]
}

Severity must be one of: "info", "warning", "blocker".
Only include comments for actual issues — do not add praise or nitpicks.
Respond with ONLY the JSON object, no other text.`;
}
