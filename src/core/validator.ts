import * as fs from 'node:fs';
import { execSync } from 'node:child_process';
import { AcceptanceCriterion } from '../types.js';

export interface ValidationResult {
  criterion: string;
  passed: boolean;
  detail?: string;
}

export function validateCriterion(criterion: AcceptanceCriterion, cwd: string): ValidationResult {
  switch (criterion.type) {
    case 'file-exists':
      return validateFileExists(criterion, cwd);
    case 'file-contains':
      return validateFileContains(criterion, cwd);
    case 'file-min-lines':
      return validateFileMinLines(criterion, cwd);
    case 'test-pass':
      return validateTestPass(criterion, cwd);
    case 'command-exit0':
      return validateCommandExit0(criterion, cwd);
    default:
      return { criterion: criterion.raw, passed: false, detail: 'unknown criterion type' };
  }
}

function resolvePath(filePath: string | undefined, cwd: string): string {
  if (!filePath) return cwd;
  const path = require('node:path');
  return path.resolve(cwd, filePath);
}

function validateFileExists(criterion: AcceptanceCriterion, cwd: string): ValidationResult {
  const fullPath = resolvePath(criterion.path, cwd);
  const exists = fs.existsSync(fullPath);
  return {
    criterion: criterion.raw,
    passed: exists,
    detail: exists ? `${criterion.path} exists` : `${criterion.path} not found`,
  };
}

function validateFileContains(criterion: AcceptanceCriterion, cwd: string): ValidationResult {
  const fullPath = resolvePath(criterion.path, cwd);
  if (!fs.existsSync(fullPath)) {
    return { criterion: criterion.raw, passed: false, detail: `${criterion.path} not found` };
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const found = content.includes(criterion.value || '');
  return {
    criterion: criterion.raw,
    passed: found,
    detail: found ? `"${criterion.value}" found` : `"${criterion.value}" not found in ${criterion.path}`,
  };
}

function validateFileMinLines(criterion: AcceptanceCriterion, cwd: string): ValidationResult {
  const fullPath = resolvePath(criterion.path, cwd);
  if (!fs.existsSync(fullPath)) {
    return { criterion: criterion.raw, passed: false, detail: `${criterion.path} not found` };
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const lineCount = content.split('\n').length;
  const minLines = criterion.minLines || 0;
  const passed = lineCount > minLines;
  return {
    criterion: criterion.raw,
    passed,
    detail: `${lineCount} lines (need > ${minLines})`,
  };
}

function validateTestPass(criterion: AcceptanceCriterion, cwd: string): ValidationResult {
  try {
    execSync('npm test', { cwd, stdio: 'pipe', timeout: 120000 });
    return { criterion: criterion.raw, passed: true, detail: 'tests passed' };
  } catch {
    return { criterion: criterion.raw, passed: false, detail: 'tests failed' };
  }
}

function validateCommandExit0(criterion: AcceptanceCriterion, cwd: string): ValidationResult {
  try {
    execSync(criterion.command || 'true', { cwd, stdio: 'pipe', timeout: 120000 });
    return { criterion: criterion.raw, passed: true, detail: `command exited 0` };
  } catch {
    return { criterion: criterion.raw, passed: false, detail: `command failed` };
  }
}
