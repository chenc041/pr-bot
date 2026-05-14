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

export function generateMergeUpdatePrompt(params: {
  currentContext: string;
  prNumber: number;
  prTitle: string;
  prDescription: string;
  diff: string;
  changedFiles: string[];
}): string {
  const filesList = params.changedFiles.join('\n');

  return `You are maintaining a project context document. A pull request was just merged.

## Current CONTEXT.md

${params.currentContext}

## Merged PR #${params.prNumber}: "${params.prTitle}"

Description: ${params.prDescription}

## Changed Files

${filesList}

## Diff

\`\`\`diff
${params.diff}
\`\`\`

## Task

Generate a concise changelog entry for the "Recent Changes" section of CONTEXT.md. This entry should:
1. Summarize what changed in 3-8 bullet points
2. Focus on meaningful user-facing changes, architectural decisions, and important refactors
3. Mention key files that were modified

Return ONLY the markdown content of the entry (the bullet points). Do NOT include a date or heading. The content will be automatically wrapped with a date heading when inserted.

Example output:
- Refactored authentication middleware to use JWT-based session management
- Updated user model with new role-based access control fields
- Added integration tests for login/logout flows`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function appendMergeUpdateToContext(
  currentContent: string,
  newEntry: string,
): string {
  const today = new Date().toISOString().split('T')[0];
  const sectionHeader = '## Recent Changes';
  const entryWithDate = `### ${today}\n\n${newEntry.trim()}`;

  const headerRegex = new RegExp(`^${escapeRegex(sectionHeader)}`, 'm');
  const match = currentContent.match(headerRegex);

  if (match && match.index !== undefined) {
    const insertionPoint = match.index + match[0].length;
    return (
      currentContent.slice(0, insertionPoint) +
      `\n\n${entryWithDate}` +
      currentContent.slice(insertionPoint)
    );
  }

  return `${currentContent.trim()}\n\n${sectionHeader}\n\n${entryWithDate}\n`;
}
