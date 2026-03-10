#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const glob_1 = require("glob");
const parser_js_1 = require("./core/parser.js");
const runner_js_1 = require("./core/runner.js");
const reporter_js_1 = require("./core/reporter.js");
const VERSION = '0.1.0';
function showHelp() {
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
function parseArgs(argv) {
    const flags = {};
    let command = '';
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--help' || arg === '-h') {
            flags.help = true;
        }
        else if (arg === '--version' || arg === '-v') {
            flags.version = true;
        }
        else if (arg === '--json') {
            flags.json = true;
        }
        else if (arg === '--parallel' && argv[i + 1]) {
            flags.parallel = argv[++i];
        }
        else if (arg === '--timeout' && argv[i + 1]) {
            flags.timeout = argv[++i];
        }
        else if (arg === '--format' && argv[i + 1]) {
            flags.format = argv[++i];
        }
        else if (!arg.startsWith('-') && !command) {
            command = arg;
        }
    }
    return { command, flags };
}
async function cmdInit() {
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
async function cmdList() {
    const files = await (0, glob_1.glob)('.tasks/*.md');
    if (files.length === 0) {
        console.log('no tasks found. run "tasks init" to get started.');
        return;
    }
    for (const file of files) {
        try {
            const spec = (0, parser_js_1.parseTaskFile)(file);
            console.log(`  ${spec.name} (${spec.acceptance.length} criteria, ${spec.timeout}s timeout)`);
        }
        catch (err) {
            console.log(`  ${file} — parse error: ${err.message}`);
        }
    }
}
async function cmdRun(flags) {
    const files = await (0, glob_1.glob)('.tasks/*.md');
    if (files.length === 0) {
        console.log('no tasks found. run "tasks init" to get started.');
        return;
    }
    const tasks = files.map(f => (0, parser_js_1.parseTaskFile)(f));
    const parallel = typeof flags.parallel === 'string' ? parseInt(flags.parallel, 10) : 1;
    const timeout = typeof flags.timeout === 'string' ? parseInt(flags.timeout, 10) : undefined;
    console.log(`running ${tasks.length} task(s) (parallel: ${parallel})...\n`);
    const results = await (0, runner_js_1.runTasks)(tasks, process.cwd(), { parallel, timeout });
    const report = (0, reporter_js_1.buildReport)(results);
    (0, reporter_js_1.saveReport)(report, '.tasks');
    if (flags.json) {
        console.log((0, reporter_js_1.formatJSON)(report));
    }
    else {
        console.log((0, reporter_js_1.formatTerminal)(report));
    }
}
async function cmdReport(flags) {
    const report = (0, reporter_js_1.loadReport)('.tasks');
    if (!report) {
        console.log('no previous run found. run "tasks run" first.');
        return;
    }
    const format = flags.format || 'terminal';
    switch (format) {
        case 'json':
            console.log((0, reporter_js_1.formatJSON)(report));
            break;
        case 'md': {
            const md = (0, reporter_js_1.formatMarkdown)(report);
            const mdPath = path.join('.tasks', 'report.md');
            fs.writeFileSync(mdPath, md);
            console.log(`report written to ${mdPath}`);
            console.log(md);
            break;
        }
        default:
            console.log((0, reporter_js_1.formatTerminal)(report));
    }
}
async function main() {
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
