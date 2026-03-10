export interface TaskSpec {
    name: string;
    timeout: number;
    task: string;
    context: string[];
    acceptance: AcceptanceCriterion[];
    filePath: string;
}
export interface AcceptanceCriterion {
    type: 'file-exists' | 'file-contains' | 'file-min-lines' | 'test-pass' | 'command-exit0';
    path?: string;
    value?: string;
    minLines?: number;
    command?: string;
    raw: string;
}
export interface TaskResult {
    name: string;
    status: 'passed' | 'failed' | 'error' | 'timeout';
    duration: number;
    acceptance: {
        criterion: string;
        passed: boolean;
        detail?: string;
    }[];
    agentOutput?: string;
    error?: string;
}
export interface RunReport {
    timestamp: string;
    tasks: TaskResult[];
    summary: {
        total: number;
        passed: number;
        failed: number;
        errors: number;
        duration: number;
    };
}
