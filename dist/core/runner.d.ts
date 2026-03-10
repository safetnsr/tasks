import { TaskSpec, TaskResult } from '../types.js';
export declare function runTasks(tasks: TaskSpec[], cwd: string, options?: {
    parallel?: number;
    timeout?: number;
}): Promise<TaskResult[]>;
