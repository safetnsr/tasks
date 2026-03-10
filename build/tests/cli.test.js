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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_child_process_1 = require("node:child_process");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const os = __importStar(require("node:os"));
const CLI_PATH = path.resolve(__dirname, '../src/cli.js');
// After test compilation, the CLI will be at build/src/cli.js
const BUILD_CLI = path.resolve(__dirname, '../src/cli.js');
function runCli(args, cwd) {
    return (0, node_child_process_1.execSync)(`node ${BUILD_CLI} ${args}`, {
        cwd: cwd || os.tmpdir(),
        encoding: 'utf8',
        timeout: 10000,
    });
}
(0, node_test_1.describe)('cli', () => {
    (0, node_test_1.it)('--help outputs help text', () => {
        const out = runCli('--help');
        strict_1.default.ok(out.includes('tasks'));
        strict_1.default.ok(out.includes('init'));
        strict_1.default.ok(out.includes('run'));
    });
    (0, node_test_1.it)('--version outputs version', () => {
        const out = runCli('--version');
        strict_1.default.match(out.trim(), /^\d+\.\d+\.\d+$/);
    });
    (0, node_test_1.it)('init creates .tasks directory', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasks-cli-'));
        runCli('init', dir);
        strict_1.default.ok(fs.existsSync(path.join(dir, '.tasks')));
        strict_1.default.ok(fs.existsSync(path.join(dir, '.tasks', 'example.md')));
        fs.rmSync(dir, { recursive: true });
    });
});
