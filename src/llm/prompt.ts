// src/llm/prompt.ts
import { ReviewInput } from '../types';

export function buildPrompt(input: ReviewInput): string {
  const sections: string[] = [];

  // 1. Project context (CONTEXT.md)
  if (input.context) {
    sections.push(`## Project Context

The following is the project's context document. Use this to understand the project's architecture, conventions, and guidelines when reviewing.

${input.context}
`);
  }

  // 2. PR info
  sections.push(`## Pull Request

**Title:** ${input.pr.title}
**Description:** ${input.pr.description}

`);

  // 3. Changed files with full contents
  const fileList = input.files
    .map((f) => `- ${f.filename} (+${f.additions} -${f.deletions})`)
    .join('\n');

  sections.push(`## Changed Files

${fileList || '(none)'}
`);

  // 4. Diff
  sections.push(`## Diff

\`\`\`diff
${input.diff}
\`\`\`
`);

  // 5. Instructions
  sections.push(`## Instructions

You are a code reviewer. Review the PR above. Use the project context (if provided) to ensure your review aligns with the project's architecture and conventions.

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
Respond with ONLY the JSON object, no other text.`);

  return sections.join('\n');
}
