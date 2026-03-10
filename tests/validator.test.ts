import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { validateCriterion } from '../src/core/validator.js';
import { AcceptanceCriterion } from '../src/types.js';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tasks-test-'));
}

describe('validator', () => {
  it('file-exists passes for existing file', () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, 'hello.ts'), 'export const x = 1;');
    const c: AcceptanceCriterion = { type: 'file-exists', path: 'hello.ts', raw: 'hello.ts exists' };
    const result = validateCriterion(c, dir);
    assert.equal(result.passed, true);
    fs.rmSync(dir, { recursive: true });
  });

  it('file-exists fails for missing file', () => {
    const dir = makeTmpDir();
    const c: AcceptanceCriterion = { type: 'file-exists', path: 'nope.ts', raw: 'nope.ts exists' };
    const result = validateCriterion(c, dir);
    assert.equal(result.passed, false);
    fs.rmSync(dir, { recursive: true });
  });

  it('file-contains passes when string is present', () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, 'a.ts'), 'export function greet() {}');
    const c: AcceptanceCriterion = { type: 'file-contains', path: 'a.ts', value: 'greet', raw: 'a.ts contains "greet"' };
    const result = validateCriterion(c, dir);
    assert.equal(result.passed, true);
    fs.rmSync(dir, { recursive: true });
  });

  it('file-contains fails when string is missing', () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, 'a.ts'), 'export function hello() {}');
    const c: AcceptanceCriterion = { type: 'file-contains', path: 'a.ts', value: 'greet', raw: 'a.ts contains "greet"' };
    const result = validateCriterion(c, dir);
    assert.equal(result.passed, false);
    fs.rmSync(dir, { recursive: true });
  });

  it('file-min-lines passes when enough lines', () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, 'b.ts'), 'line1\nline2\nline3\nline4\nline5\n');
    const c: AcceptanceCriterion = { type: 'file-min-lines', path: 'b.ts', minLines: 3, raw: 'b.ts > 3 lines' };
    const result = validateCriterion(c, dir);
    assert.equal(result.passed, true);
    fs.rmSync(dir, { recursive: true });
  });

  it('file-min-lines fails when too few lines', () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, 'b.ts'), 'line1\n');
    const c: AcceptanceCriterion = { type: 'file-min-lines', path: 'b.ts', minLines: 10, raw: 'b.ts > 10 lines' };
    const result = validateCriterion(c, dir);
    assert.equal(result.passed, false);
    fs.rmSync(dir, { recursive: true });
  });
});
