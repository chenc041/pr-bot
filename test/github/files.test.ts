// test/github/files.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { walkTree, readKeyFiles, readChangedFiles } from '../../src/github/files';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('walkTree', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-bot-tree-'));
    fs.mkdirSync(path.join(tmpDir, 'src'));
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{}');
    fs.writeFileSync(path.join(tmpDir, 'src/index.ts'), '// code');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('outputs directory tree', () => {
    const tree = walkTree(tmpDir);
    expect(tree).toContain('package.json');
    expect(tree).toContain('src/');
    expect(tree).toContain('index.ts');
  });

  it('excludes node_modules', () => {
    fs.mkdirSync(path.join(tmpDir, 'node_modules'));
    fs.writeFileSync(path.join(tmpDir, 'node_modules/dep.js'), '');
    const tree = walkTree(tmpDir);
    expect(tree).not.toContain('node_modules');
  });

  it('excludes .git', () => {
    fs.mkdirSync(path.join(tmpDir, '.git'));
    const tree = walkTree(tmpDir);
    expect(tree).not.toContain('.git');
  });
});

describe('readKeyFiles', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-bot-key-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reads existing key files', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{"name":"test"}');
    const result = readKeyFiles(tmpDir);
    expect(result['package.json']).toContain('"name":"test"');
  });

  it('returns empty for missing files', () => {
    const result = readKeyFiles(tmpDir);
    expect(Object.keys(result)).toHaveLength(0);
  });
});

describe('readChangedFiles', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-bot-changed-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reads files with line numbers', () => {
    fs.writeFileSync(path.join(tmpDir, 'a.ts'), 'line1\nline2\n');
    const result = readChangedFiles(tmpDir, ['a.ts']);
    expect(result).toContain('a.ts');
    expect(result).toContain('1| line1');
    expect(result).toContain('2| line2');
  });

  it('handles deleted files', () => {
    const result = readChangedFiles(tmpDir, ['deleted.ts']);
    expect(result).toContain('file deleted');
  });
});
