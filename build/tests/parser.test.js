"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const parser_js_1 = require("../src/core/parser.js");
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
(0, node_test_1.describe)('parser', () => {
    (0, node_test_1.it)('parses valid task spec with all sections', () => {
        const spec = (0, parser_js_1.parseTaskContent)(validMd, 'test.md');
        strict_1.default.equal(spec.name, 'test-task');
        strict_1.default.equal(spec.timeout, 120);
        strict_1.default.ok(spec.task.includes('Do something useful'));
        strict_1.default.equal(spec.context.length, 2);
        strict_1.default.equal(spec.acceptance.length, 5);
    });
    (0, node_test_1.it)('parses frontmatter name and timeout', () => {
        const spec = (0, parser_js_1.parseTaskContent)(validMd, 'test.md');
        strict_1.default.equal(spec.name, 'test-task');
        strict_1.default.equal(spec.timeout, 120);
    });
    (0, node_test_1.it)('uses filename as name when frontmatter has no name', () => {
        const md = `---
timeout: 60
---

## task
Do it.

## acceptance
- [ ] test:pass
`;
        const spec = (0, parser_js_1.parseTaskContent)(md, '/some/path/my-task.md');
        strict_1.default.equal(spec.name, 'my-task');
    });
    (0, node_test_1.it)('defaults timeout to 600 when not specified', () => {
        const md = `---
name: quick
---

## task
Do it.

## acceptance
- [ ] test:pass
`;
        const spec = (0, parser_js_1.parseTaskContent)(md, 'test.md');
        strict_1.default.equal(spec.timeout, 600);
    });
    (0, node_test_1.it)('extracts context files correctly (with and without bullet markers)', () => {
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
        const spec = (0, parser_js_1.parseTaskContent)(md, 'test.md');
        strict_1.default.deepEqual(spec.context, ['src/a.ts', 'src/b.ts', 'src/c.ts']);
    });
    (0, node_test_1.it)('throws on missing ## task section', () => {
        const md = `---
name: bad
---

## acceptance
- [ ] test:pass
`;
        strict_1.default.throws(() => (0, parser_js_1.parseTaskContent)(md, 'bad.md'), /Missing ## task/);
    });
    (0, node_test_1.it)('throws on missing ## acceptance section', () => {
        const md = `---
name: bad
---

## task
Do it.
`;
        strict_1.default.throws(() => (0, parser_js_1.parseTaskContent)(md, 'bad.md'), /Missing ## acceptance/);
    });
    (0, node_test_1.it)('parses file-exists acceptance criterion', () => {
        const spec = (0, parser_js_1.parseTaskContent)(validMd, 'test.md');
        const c = spec.acceptance[0];
        strict_1.default.equal(c.type, 'file-exists');
        strict_1.default.equal(c.path, 'src/index.ts');
    });
    (0, node_test_1.it)('parses file-contains acceptance criterion', () => {
        const spec = (0, parser_js_1.parseTaskContent)(validMd, 'test.md');
        const c = spec.acceptance[1];
        strict_1.default.equal(c.type, 'file-contains');
        strict_1.default.equal(c.path, 'src/index.ts');
        strict_1.default.equal(c.value, 'hello');
    });
    (0, node_test_1.it)('parses file-min-lines acceptance criterion', () => {
        const spec = (0, parser_js_1.parseTaskContent)(validMd, 'test.md');
        const c = spec.acceptance[2];
        strict_1.default.equal(c.type, 'file-min-lines');
        strict_1.default.equal(c.path, 'src/index.ts');
        strict_1.default.equal(c.minLines, 5);
    });
    (0, node_test_1.it)('parses test:pass acceptance criterion', () => {
        const spec = (0, parser_js_1.parseTaskContent)(validMd, 'test.md');
        const c = spec.acceptance[3];
        strict_1.default.equal(c.type, 'test-pass');
    });
    (0, node_test_1.it)('parses command:exit0 acceptance criterion', () => {
        const spec = (0, parser_js_1.parseTaskContent)(validMd, 'test.md');
        const c = spec.acceptance[4];
        strict_1.default.equal(c.type, 'command-exit0');
        strict_1.default.equal(c.command, 'echo ok');
    });
    (0, node_test_1.it)('handles empty context section gracefully', () => {
        const md = `---
name: no-ctx
---

## task
Do it.

## context

## acceptance
- [ ] test:pass
`;
        const spec = (0, parser_js_1.parseTaskContent)(md, 'test.md');
        strict_1.default.deepEqual(spec.context, []);
    });
});
