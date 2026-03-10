#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';
import { parseTaskFile } from './core/parser.js';
import { runTasks } from './core/runner.js';
import { buildReport, formatTerminal, formatJSON, formatMarkdown, saveReport, loadReport } from './core/reporter.js';

const VERSION = '0.1.0';

function showHelp(): void {
  console.log(`tasks v${VERSION} — open source copilot tasks

usage:
  tasks init                          scaffold .tasks/ directory
  tasks run [--parallel N] [--timeout M] [--json]  execute tasks
  tasks report [--format terminal|json|md]         show last run
  tasks list                          list all task specs
  tasks --help                        show this help
  tasks --version                     show version

flags:
  --parallel N   run N tasks simultaneously (default: 1)
  --timeout N    per-task timeout in seconds (default: 600)
  --json         output as JSON
  --format       report format: terminal, json, md (default: terminal)
`);
}

function parseArgs(argv: string[]): { command: string; flags: Record<string, string | boolean> } {
  const flags: Record<string, string | boolean> = {};
  let command = '';

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      flags.help = true;
    } else if (arg === '--version' || arg === '-v') {
      flags.version = true;
    } else if (arg === '--json') {
      flags.json = true;
    } else if (arg === '--parallel' && argv[i + 1]) {
      flags.parallel = argv[++i];
    } else if (arg === '--timeout' && argv[i + 1]) {
      flags.timeout = argv[++i];
    } else if (arg === '--format' && argv[i + 1]) {
      flags.format = argv[++i];
    } else if (!arg.startsWith('-') && !command) {
      command = arg;
    }
  }

  return { command, flags };
}

async function cmdInit(): Promise<void> {
  const tasksDir = path.resolve('.tasks');
  fs.mkdirSync(tasksDir, { recursive: true });

  const examplePath = path.join(tasksDir, 'example.md');
  if (!fs.existsSync(examplePath)) {
    fs.writeFileSync(examplePath, `---
name: example-task
timeout: 300
---

## task
Create a hello world function in src/hello.ts that exports
a greet(name: string) function returning "Hello, {name}!".

## context
- src/
- package.json

## acceptance
- [ ] src/hello.ts exists
- [ ] src/hello.ts contains "greet"
- [ ] src/hello.ts > 3 lines
`);
  }

  console.log('created .tasks/ with example.md');
}

async function cmdList(): Promise<void> {
  const files = await glob('.tasks/*.md');
  if (files.length === 0) {
    console.log('no tasks found. run "tasks init" to get started.');
    return;
  }

  for (const file of files) {
    try {
      const spec = parseTaskFile(file);
      console.log(`  ${spec.name} (${spec.acceptance.length} criteria, ${spec.timeout}s timeout)`);
    } catch (err) {
      console.log(`  ${file} — parse error: ${(err as Error).message}`);
    }
  }
}

async function cmdRun(flags: Record<string, string | boolean>): Promise<void> {
  const files = await glob('.tasks/*.md');
  if (files.length === 0) {
    console.log('no tasks found. run "tasks init" to get started.');
    return;
  }

  const tasks = files.map(f => parseTaskFile(f));
  const parallel = typeof flags.parallel === 'string' ? parseInt(flags.parallel, 10) : 1;
  const timeout = typeof flags.timeout === 'string' ? parseInt(flags.timeout, 10) : undefined;

  console.log(`running ${tasks.length} task(s) (parallel: ${parallel})...\n`);

  const results = await runTasks(tasks, process.cwd(), { parallel, timeout });
  const report = buildReport(results);

  saveReport(report, '.tasks');

  if (flags.json) {
    console.log(formatJSON(report));
  } else {
    console.log(formatTerminal(report));
  }
}

async function cmdReport(flags: Record<string, string | boolean>): Promise<void> {
  const report = loadReport('.tasks');
  if (!report) {
    console.log('no previous run found. run "tasks run" first.');
    return;
  }

  const format = (flags.format as string) || 'terminal';
  switch (format) {
    case 'json':
      console.log(formatJSON(report));
      break;
    case 'md': {
      const md = formatMarkdown(report);
      const mdPath = path.join('.tasks', 'report.md');
      fs.writeFileSync(mdPath, md);
      console.log(`report written to ${mdPath}`);
      console.log(md);
      break;
    }
    default:
      console.log(formatTerminal(report));
  }
}

async function main(): Promise<void> {
  const { command, flags } = parseArgs(process.argv.slice(2));

  if (flags.help) {
    showHelp();
    return;
  }

  if (flags.version) {
    console.log(VERSION);
    return;
  }

  switch (command) {
    case 'init':
      await cmdInit();
      break;
    case 'run':
      await cmdRun(flags);
      break;
    case 'report':
      await cmdReport(flags);
      break;
    case 'list':
      await cmdList();
      break;
    default:
      showHelp();
  }
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
