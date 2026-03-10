import * as fs from 'node:fs';
import * as path from 'node:path';
import YAML from 'yaml';
import { TaskSpec, AcceptanceCriterion } from '../types.js';

export function parseTaskFile(filePath: string): TaskSpec {
  const content = fs.readFileSync(filePath, 'utf8');
  return parseTaskContent(content, filePath);
}

export function parseTaskContent(content: string, filePath: string): TaskSpec {
  const { frontmatter, body } = extractFrontmatter(content);

  const taskSection = extractSection(body, 'task');
  if (taskSection === null) {
    throw new Error(`Missing ## task section in ${filePath}`);
  }

  const acceptanceSection = extractSection(body, 'acceptance');
  if (acceptanceSection === null) {
    throw new Error(`Missing ## acceptance section in ${filePath}`);
  }

  const contextSection = extractSection(body, 'context');
  const contextFiles = contextSection ? parseContextList(contextSection) : [];
  const acceptance = parseAcceptanceCriteria(acceptanceSection);

  const name = (typeof frontmatter.name === 'string' ? frontmatter.name : '') || path.basename(filePath, '.md');
  const timeout = typeof frontmatter.timeout === 'number' ? frontmatter.timeout : 600;

  return {
    name,
    timeout,
    task: taskSection.trim(),
    context: contextFiles,
    acceptance,
    filePath,
  };
}

function extractFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!fmMatch) {
    return { frontmatter: {}, body: content };
  }
  let frontmatter: Record<string, unknown> = {};
  try {
    frontmatter = YAML.parse(fmMatch[1]) || {};
  } catch {
    frontmatter = {};
  }
  return { frontmatter, body: fmMatch[2] };
}

function extractSection(body: string, sectionName: string): string | null {
  const regex = new RegExp(`^## ${sectionName}\\s*$`, 'im');
  const match = regex.exec(body);
  if (!match) return null;

  const start = match.index + match[0].length;
  const nextSection = body.slice(start).search(/^## /m);
  const end = nextSection === -1 ? body.length : start + nextSection;
  return body.slice(start, end).trim();
}

function parseContextList(section: string): string[] {
  return section
    .split('\n')
    .map(line => line.replace(/^[\s]*[-*]\s*/, '').trim())
    .filter(line => line.length > 0);
}

function parseAcceptanceCriteria(section: string): AcceptanceCriterion[] {
  return section
    .split('\n')
    .map(line => line.replace(/^[\s]*-\s*\[[ x]?\]\s*/, '').trim())
    .filter(line => line.length > 0)
    .map(parseCriterionLine);
}

function parseCriterionLine(raw: string): AcceptanceCriterion {
  // test:pass
  if (/^test:pass$/i.test(raw)) {
    return { type: 'test-pass', raw };
  }

  // command:exit0 "<cmd>"
  const cmdMatch = raw.match(/^command:exit0\s+"(.+)"$/i);
  if (cmdMatch) {
    return { type: 'command-exit0', command: cmdMatch[1], raw };
  }

  // <path> contains "<str>"
  const containsMatch = raw.match(/^(\S+)\s+contains\s+"(.+)"$/i);
  if (containsMatch) {
    return { type: 'file-contains', path: containsMatch[1], value: containsMatch[2], raw };
  }

  // <path> > N lines
  const linesMatch = raw.match(/^(\S+)\s*>\s*(\d+)\s+lines$/i);
  if (linesMatch) {
    return { type: 'file-min-lines', path: linesMatch[1], minLines: parseInt(linesMatch[2], 10), raw };
  }

  // <path> exists
  const existsMatch = raw.match(/^(\S+)\s+exists$/i);
  if (existsMatch) {
    return { type: 'file-exists', path: existsMatch[1], raw };
  }

  // fallback: if it looks like a file path, treat as file-exists
  if (/\.\w+$/.test(raw) || raw.includes('/')) {
    return { type: 'file-exists', path: raw.trim(), raw };
  }

  // otherwise treat as test-pass
  return { type: 'test-pass', raw };
}
