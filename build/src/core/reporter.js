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
exports.buildReport = buildReport;
exports.formatTerminal = formatTerminal;
exports.formatJSON = formatJSON;
exports.formatMarkdown = formatMarkdown;
exports.saveReport = saveReport;
exports.loadReport = loadReport;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const chalk_1 = __importDefault(require("chalk"));
function buildReport(results) {
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    return {
        timestamp: new Date().toISOString(),
        tasks: results,
        summary: {
            total: results.length,
            passed: results.filter(r => r.status === 'passed').length,
            failed: results.filter(r => r.status === 'failed').length,
            errors: results.filter(r => r.status === 'error' || r.status === 'timeout').length,
            duration: totalDuration,
        },
    };
}
function formatTerminal(report) {
    const lines = [];
    const colW = { name: 14, status: 12, duration: 10, acceptance: 13 };
    const hdr = `| ${'task'.padEnd(colW.name)} | ${'status'.padEnd(colW.status)} | ${'duration'.padEnd(colW.duration)} | ${'acceptance'.padEnd(colW.acceptance)} |`;
    const sep = `|${'-'.repeat(colW.name + 2)}|${'-'.repeat(colW.status + 2)}|${'-'.repeat(colW.duration + 2)}|${'-'.repeat(colW.acceptance + 2)}|`;
    lines.push(sep, hdr, sep);
    for (const task of report.tasks) {
        const name = task.name.slice(0, colW.name).padEnd(colW.name);
        const passedCount = task.acceptance.filter(a => a.passed).length;
        const totalCount = task.acceptance.length;
        const accStr = `${passedCount}/${totalCount}`.padEnd(colW.acceptance);
        const durStr = `${Math.round(task.duration / 1000)}s`.padEnd(colW.duration);
        let statusStr;
        switch (task.status) {
            case 'passed':
                statusStr = chalk_1.default.green('✓ pass'.padEnd(colW.status));
                break;
            case 'failed':
                statusStr = chalk_1.default.red('✗ fail'.padEnd(colW.status));
                break;
            case 'timeout':
                statusStr = chalk_1.default.yellow('⏱ timeout'.padEnd(colW.status));
                break;
            default:
                statusStr = chalk_1.default.red('✗ error'.padEnd(colW.status));
        }
        lines.push(`| ${name} | ${statusStr} | ${durStr} | ${accStr} |`);
    }
    lines.push(sep);
    const s = report.summary;
    const totalDur = `${Math.round(s.duration / 1000)}s`;
    lines.push(`\nsummary: ${s.passed}/${s.total} passed | ${s.failed} failed | ${s.errors} errors | ${totalDur} total`);
    return lines.join('\n');
}
function formatJSON(report) {
    return JSON.stringify(report, null, 2);
}
function formatMarkdown(report) {
    const lines = ['# Task Report', '', `**Date:** ${report.timestamp}`, ''];
    lines.push('| Task | Status | Duration | Acceptance |');
    lines.push('|------|--------|----------|------------|');
    for (const task of report.tasks) {
        const passed = task.acceptance.filter(a => a.passed).length;
        const total = task.acceptance.length;
        const dur = `${Math.round(task.duration / 1000)}s`;
        lines.push(`| ${task.name} | ${task.status} | ${dur} | ${passed}/${total} |`);
    }
    const s = report.summary;
    lines.push('', `**Summary:** ${s.passed}/${s.total} passed | ${s.failed} failed | ${s.errors} errors | ${Math.round(s.duration / 1000)}s total`);
    return lines.join('\n');
}
function saveReport(report, tasksDir) {
    const reportPath = path.join(tasksDir, '.last-run.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}
function loadReport(tasksDir) {
    const reportPath = path.join(tasksDir, '.last-run.json');
    if (!fs.existsSync(reportPath))
        return null;
    return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
}
