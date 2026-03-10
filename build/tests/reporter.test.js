"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const reporter_js_1 = require("../src/core/reporter.js");
const sampleResults = [
    {
        name: 'task-a',
        status: 'passed',
        duration: 5000,
        acceptance: [{ criterion: 'a.ts exists', passed: true }],
    },
    {
        name: 'task-b',
        status: 'failed',
        duration: 3000,
        acceptance: [
            { criterion: 'b.ts exists', passed: true },
            { criterion: 'b.ts contains "x"', passed: false },
        ],
    },
    {
        name: 'task-c',
        status: 'error',
        duration: 1000,
        acceptance: [{ criterion: 'test:pass', passed: false }],
        error: 'claude not found',
    },
];
(0, node_test_1.describe)('reporter', () => {
    (0, node_test_1.it)('generates valid JSON report shape', () => {
        const report = (0, reporter_js_1.buildReport)(sampleResults);
        strict_1.default.ok(report.timestamp);
        strict_1.default.ok(Array.isArray(report.tasks));
        strict_1.default.equal(report.tasks.length, 3);
        strict_1.default.ok(report.summary);
        strict_1.default.equal(typeof report.summary.total, 'number');
        strict_1.default.equal(typeof report.summary.passed, 'number');
        strict_1.default.equal(typeof report.summary.failed, 'number');
        strict_1.default.equal(typeof report.summary.errors, 'number');
        strict_1.default.equal(typeof report.summary.duration, 'number');
    });
    (0, node_test_1.it)('summary counts are correct', () => {
        const report = (0, reporter_js_1.buildReport)(sampleResults);
        strict_1.default.equal(report.summary.total, 3);
        strict_1.default.equal(report.summary.passed, 1);
        strict_1.default.equal(report.summary.failed, 1);
        strict_1.default.equal(report.summary.errors, 1);
        strict_1.default.equal(report.summary.duration, 9000);
    });
});
