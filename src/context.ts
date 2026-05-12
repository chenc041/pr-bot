import fs from 'fs';
import path from 'path';
import { BotConfig } from './types';

export function loadContext(repoPath: string, config: BotConfig): ContextResult {
  const contextFile = config.context?.file ?? 'CONTEXT.md';
  const contextPath = path.join(repoPath, contextFile);

  if (fs.existsSync(contextPath)) {
    const content = fs.readFileSync(contextPath, 'utf-8').trim();
    return { exists: true, content, path: contextPath, filename: contextFile };
  }

  return { exists: false, path: contextPath, filename: contextFile };
}

export interface ContextResult {
  exists: boolean;
  content?: string;
  path: string;
  filename: string;
}

export function generateContextPrompt(
  tree: string,
  keyFiles: Record<string, string>,
  commitHistory: string,
  sourceFiles: Record<string, string>
): string {
  const keyFileSection = Object.entries(keyFiles)
    .map(([name, content]) => `### ${name}\n\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n');

  const sourceFileSection = Object.entries(sourceFiles)
    .map(([name, content]) => `### ${name}\n\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n');

  return `You are analyzing a codebase to generate a CONTEXT.md file. This file will be used by an AI code reviewer to understand the project.

## Project Structure

\`\`\`
${tree}
\`\`\`

## Commit History

${commitHistory}

## Configuration Files

${keyFileSection || '_(none found)_'}

## Frequently Changed Source Files

${sourceFileSection || '_(none found)_'}

## Task

Generate a CONTEXT.md file. Use the standard review response format:
{
  "summary": "<full CONTEXT.md content in markdown>",
  "comments": []
}

The summary field should contain a complete markdown document with these sections:
1. **Project Overview**: Purpose, tech stack, architecture
2. **Directory Structure**: Key directories and their purposes
3. **Conventions**: Coding style, naming, patterns, testing approach
4. **Dependencies**: Key external dependencies
5. **Key Modules**: Important files/modules and their roles
6. **Evolution**: How the project grows (based on commit patterns)
7. **Review Guidelines**: What reviewers should focus on

Keep it concise (300-500 words). Focus on what helps an AI code reviewer.`;
}
