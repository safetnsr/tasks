import { TaskResult, RunReport } from '../types.js';
export declare function buildReport(results: TaskResult[]): RunReport;
export declare function formatTerminal(report: RunReport): string;
export declare function formatJSON(report: RunReport): string;
export declare function formatMarkdown(report: RunReport): string;
export declare function saveReport(report: RunReport, tasksDir: string): void;
export declare function loadReport(tasksDir: string): RunReport | null;
