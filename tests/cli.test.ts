import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

const CLI_PATH = path.resolve(__dirname, '../src/cli.js');
// After test compilation, the CLI will be at build/src/cli.js
const BUILD_CLI = path.resolve(__dirname, '../src/cli.js');

function runCli(args: string, cwd?: string): string {
  return execSync(`node ${BUILD_CLI} ${args}`, {
    cwd: cwd || os.tmpdir(),
    encoding: 'utf8',
    timeout: 10000,
  });
}

describe('cli', () => {
  it('--help outputs help text', () => {
    const out = runCli('--help');
    assert.ok(out.includes('tasks'));
    assert.ok(out.includes('init'));
    assert.ok(out.includes('run'));
  });

  it('--version outputs version', () => {
    const out = runCli('--version');
    assert.match(out.trim(), /^\d+\.\d+\.\d+$/);
  });

  it('init creates .tasks directory', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasks-cli-'));
    runCli('init', dir);
    assert.ok(fs.existsSync(path.join(dir, '.tasks')));
    assert.ok(fs.existsSync(path.join(dir, '.tasks', 'example.md')));
    fs.rmSync(dir, { recursive: true });
  });
});
