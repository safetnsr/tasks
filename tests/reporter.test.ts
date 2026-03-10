import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport } from '../src/core/reporter.js';
import { TaskResult } from '../src/types.js';

const sampleResults: TaskResult[] = [
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

describe('reporter', () => {
  it('generates valid JSON report shape', () => {
    const report = buildReport(sampleResults);
    assert.ok(report.timestamp);
    assert.ok(Array.isArray(report.tasks));
    assert.equal(report.tasks.length, 3);
    assert.ok(report.summary);
    assert.equal(typeof report.summary.total, 'number');
    assert.equal(typeof report.summary.passed, 'number');
    assert.equal(typeof report.summary.failed, 'number');
    assert.equal(typeof report.summary.errors, 'number');
    assert.equal(typeof report.summary.duration, 'number');
  });

  it('summary counts are correct', () => {
    const report = buildReport(sampleResults);
    assert.equal(report.summary.total, 3);
    assert.equal(report.summary.passed, 1);
    assert.equal(report.summary.failed, 1);
    assert.equal(report.summary.errors, 1);
    assert.equal(report.summary.duration, 9000);
  });
});
