import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseTaskContent } from '../src/core/parser.js';

const validMd = `---
name: test-task
timeout: 120
---

## task
Do something useful.

## context
- src/index.ts
- package.json

## acceptance
- [ ] src/index.ts exists
- [ ] src/index.ts contains "hello"
- [ ] src/index.ts > 5 lines
- [ ] test:pass
- [ ] command:exit0 "echo ok"
`;

describe('parser', () => {
  it('parses valid task spec with all sections', () => {
    const spec = parseTaskContent(validMd, 'test.md');
    assert.equal(spec.name, 'test-task');
    assert.equal(spec.timeout, 120);
    assert.ok(spec.task.includes('Do something useful'));
    assert.equal(spec.context.length, 2);
    assert.equal(spec.acceptance.length, 5);
  });

  it('parses frontmatter name and timeout', () => {
    const spec = parseTaskContent(validMd, 'test.md');
    assert.equal(spec.name, 'test-task');
    assert.equal(spec.timeout, 120);
  });

  it('uses filename as name when frontmatter has no name', () => {
    const md = `---
timeout: 60
---

## task
Do it.

## acceptance
- [ ] test:pass
`;
    const spec = parseTaskContent(md, '/some/path/my-task.md');
    assert.equal(spec.name, 'my-task');
  });

  it('defaults timeout to 600 when not specified', () => {
    const md = `---
name: quick
---

## task
Do it.

## acceptance
- [ ] test:pass
`;
    const spec = parseTaskContent(md, 'test.md');
    assert.equal(spec.timeout, 600);
  });

  it('extracts context files correctly (with and without bullet markers)', () => {
    const md = `---
name: ctx
---

## task
Do it.

## context
- src/a.ts
* src/b.ts
src/c.ts

## acceptance
- [ ] test:pass
`;
    const spec = parseTaskContent(md, 'test.md');
    assert.deepEqual(spec.context, ['src/a.ts', 'src/b.ts', 'src/c.ts']);
  });

  it('throws on missing ## task section', () => {
    const md = `---
name: bad
---

## acceptance
- [ ] test:pass
`;
    assert.throws(() => parseTaskContent(md, 'bad.md'), /Missing ## task/);
  });

  it('throws on missing ## acceptance section', () => {
    const md = `---
name: bad
---

## task
Do it.
`;
    assert.throws(() => parseTaskContent(md, 'bad.md'), /Missing ## acceptance/);
  });

  it('parses file-exists acceptance criterion', () => {
    const spec = parseTaskContent(validMd, 'test.md');
    const c = spec.acceptance[0];
    assert.equal(c.type, 'file-exists');
    assert.equal(c.path, 'src/index.ts');
  });

  it('parses file-contains acceptance criterion', () => {
    const spec = parseTaskContent(validMd, 'test.md');
    const c = spec.acceptance[1];
    assert.equal(c.type, 'file-contains');
    assert.equal(c.path, 'src/index.ts');
    assert.equal(c.value, 'hello');
  });

  it('parses file-min-lines acceptance criterion', () => {
    const spec = parseTaskContent(validMd, 'test.md');
    const c = spec.acceptance[2];
    assert.equal(c.type, 'file-min-lines');
    assert.equal(c.path, 'src/index.ts');
    assert.equal(c.minLines, 5);
  });

  it('parses test:pass acceptance criterion', () => {
    const spec = parseTaskContent(validMd, 'test.md');
    const c = spec.acceptance[3];
    assert.equal(c.type, 'test-pass');
  });

  it('parses command:exit0 acceptance criterion', () => {
    const spec = parseTaskContent(validMd, 'test.md');
    const c = spec.acceptance[4];
    assert.equal(c.type, 'command-exit0');
    assert.equal(c.command, 'echo ok');
  });

  it('handles empty context section gracefully', () => {
    const md = `---
name: no-ctx
---

## task
Do it.

## context

## acceptance
- [ ] test:pass
`;
    const spec = parseTaskContent(md, 'test.md');
    assert.deepEqual(spec.context, []);
  });
});
