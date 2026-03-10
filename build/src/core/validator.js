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
exports.validateCriterion = validateCriterion;
const fs = __importStar(require("node:fs"));
const node_child_process_1 = require("node:child_process");
function validateCriterion(criterion, cwd) {
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
function resolvePath(filePath, cwd) {
    if (!filePath)
        return cwd;
    const path = require('node:path');
    return path.resolve(cwd, filePath);
}
function validateFileExists(criterion, cwd) {
    const fullPath = resolvePath(criterion.path, cwd);
    const exists = fs.existsSync(fullPath);
    return {
        criterion: criterion.raw,
        passed: exists,
        detail: exists ? `${criterion.path} exists` : `${criterion.path} not found`,
    };
}
function validateFileContains(criterion, cwd) {
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
function validateFileMinLines(criterion, cwd) {
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
function validateTestPass(criterion, cwd) {
    try {
        (0, node_child_process_1.execSync)('npm test', { cwd, stdio: 'pipe', timeout: 120000 });
        return { criterion: criterion.raw, passed: true, detail: 'tests passed' };
    }
    catch {
        return { criterion: criterion.raw, passed: false, detail: 'tests failed' };
    }
}
function validateCommandExit0(criterion, cwd) {
    try {
        (0, node_child_process_1.execSync)(criterion.command || 'true', { cwd, stdio: 'pipe', timeout: 120000 });
        return { criterion: criterion.raw, passed: true, detail: `command exited 0` };
    }
    catch {
        return { criterion: criterion.raw, passed: false, detail: `command failed` };
    }
}
