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
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const os = __importStar(require("node:os"));
const validator_js_1 = require("../src/core/validator.js");
function makeTmpDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'tasks-test-'));
}
(0, node_test_1.describe)('validator', () => {
    (0, node_test_1.it)('file-exists passes for existing file', () => {
        const dir = makeTmpDir();
        fs.writeFileSync(path.join(dir, 'hello.ts'), 'export const x = 1;');
        const c = { type: 'file-exists', path: 'hello.ts', raw: 'hello.ts exists' };
        const result = (0, validator_js_1.validateCriterion)(c, dir);
        strict_1.default.equal(result.passed, true);
        fs.rmSync(dir, { recursive: true });
    });
    (0, node_test_1.it)('file-exists fails for missing file', () => {
        const dir = makeTmpDir();
        const c = { type: 'file-exists', path: 'nope.ts', raw: 'nope.ts exists' };
        const result = (0, validator_js_1.validateCriterion)(c, dir);
        strict_1.default.equal(result.passed, false);
        fs.rmSync(dir, { recursive: true });
    });
    (0, node_test_1.it)('file-contains passes when string is present', () => {
        const dir = makeTmpDir();
        fs.writeFileSync(path.join(dir, 'a.ts'), 'export function greet() {}');
        const c = { type: 'file-contains', path: 'a.ts', value: 'greet', raw: 'a.ts contains "greet"' };
        const result = (0, validator_js_1.validateCriterion)(c, dir);
        strict_1.default.equal(result.passed, true);
        fs.rmSync(dir, { recursive: true });
    });
    (0, node_test_1.it)('file-contains fails when string is missing', () => {
        const dir = makeTmpDir();
        fs.writeFileSync(path.join(dir, 'a.ts'), 'export function hello() {}');
        const c = { type: 'file-contains', path: 'a.ts', value: 'greet', raw: 'a.ts contains "greet"' };
        const result = (0, validator_js_1.validateCriterion)(c, dir);
        strict_1.default.equal(result.passed, false);
        fs.rmSync(dir, { recursive: true });
    });
    (0, node_test_1.it)('file-min-lines passes when enough lines', () => {
        const dir = makeTmpDir();
        fs.writeFileSync(path.join(dir, 'b.ts'), 'line1\nline2\nline3\nline4\nline5\n');
        const c = { type: 'file-min-lines', path: 'b.ts', minLines: 3, raw: 'b.ts > 3 lines' };
        const result = (0, validator_js_1.validateCriterion)(c, dir);
        strict_1.default.equal(result.passed, true);
        fs.rmSync(dir, { recursive: true });
    });
    (0, node_test_1.it)('file-min-lines fails when too few lines', () => {
        const dir = makeTmpDir();
        fs.writeFileSync(path.join(dir, 'b.ts'), 'line1\n');
        const c = { type: 'file-min-lines', path: 'b.ts', minLines: 10, raw: 'b.ts > 10 lines' };
        const result = (0, validator_js_1.validateCriterion)(c, dir);
        strict_1.default.equal(result.passed, false);
        fs.rmSync(dir, { recursive: true });
    });
});
