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

export function generateContextPrompt(tree: string, keyFiles: Record<string, string>): string {
  const fileContents = Object.entries(keyFiles)
    .map(([name, content]) => `### ${name}\n\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n');

  return `You are analyzing a codebase to create a project context file. This file will be used by an AI code reviewer to understand the project when reviewing pull requests.

## Project Structure

\`\`\`
${tree}
\`\`\`

## Key Files

${fileContents}

## Task

Generate a CONTEXT.md file with these sections:
1. **Project Overview**: What this project does, tech stack, architecture
2. **Directory Structure**: Key directories and their purposes
3. **Conventions**: Coding style, naming conventions, patterns used
4. **Dependencies**: Key external dependencies and how they're used
5. **Guidelines for Reviewers**: What to look for when reviewing PRs in this project

Write in markdown format. Keep it concise but thorough. Focus on information that would help an AI code reviewer understand the project and provide better PR reviews.`;
}
