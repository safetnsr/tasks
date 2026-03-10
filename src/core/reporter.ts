import * as fs from 'node:fs';
import * as path from 'node:path';
import chalk from 'chalk';
import { TaskResult, RunReport } from '../types.js';

export function buildReport(results: TaskResult[]): RunReport {
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

export function formatTerminal(report: RunReport): string {
  const lines: string[] = [];
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

    let statusStr: string;
    switch (task.status) {
      case 'passed':
        statusStr = chalk.green('✓ pass'.padEnd(colW.status));
        break;
      case 'failed':
        statusStr = chalk.red('✗ fail'.padEnd(colW.status));
        break;
      case 'timeout':
        statusStr = chalk.yellow('⏱ timeout'.padEnd(colW.status));
        break;
      default:
        statusStr = chalk.red('✗ error'.padEnd(colW.status));
    }

    lines.push(`| ${name} | ${statusStr} | ${durStr} | ${accStr} |`);
  }

  lines.push(sep);

  const s = report.summary;
  const totalDur = `${Math.round(s.duration / 1000)}s`;
  lines.push(`\nsummary: ${s.passed}/${s.total} passed | ${s.failed} failed | ${s.errors} errors | ${totalDur} total`);

  return lines.join('\n');
}

export function formatJSON(report: RunReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatMarkdown(report: RunReport): string {
  const lines: string[] = ['# Task Report', '', `**Date:** ${report.timestamp}`, ''];
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

export function saveReport(report: RunReport, tasksDir: string): void {
  const reportPath = path.join(tasksDir, '.last-run.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

export function loadReport(tasksDir: string): RunReport | null {
  const reportPath = path.join(tasksDir, '.last-run.json');
  if (!fs.existsSync(reportPath)) return null;
  return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
}
