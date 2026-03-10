import { spawn, execSync } from 'node:child_process';
import { TaskSpec, TaskResult } from '../types.js';
import { validateCriterion } from './validator.js';

function isClaudeAvailable(): boolean {
  try {
    execSync('which claude', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function buildPrompt(task: TaskSpec): string {
  let prompt = '';
  if (task.context.length > 0) {
    prompt += `The following files are relevant: ${task.context.join(', ')}\n\n`;
  }
  prompt += task.task;
  return prompt;
}

function runSingleTask(task: TaskSpec, cwd: string, timeoutOverride?: number): Promise<TaskResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const timeout = (timeoutOverride || task.timeout) * 1000;
    const prompt = buildPrompt(task);

    const child = spawn('claude', ['--print', '--dangerously-skip-permissions', prompt], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
    child.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => { if (!child.killed) child.kill('SIGKILL'); }, 5000);
    }, timeout);

    child.on('close', (code) => {
      clearTimeout(timer);
      const duration = Date.now() - startTime;
      const timedOut = duration >= timeout - 100;

      if (timedOut && (code !== 0 || !stdout)) {
        const acceptanceResults = task.acceptance.map(c => ({
          criterion: c.raw,
          passed: false,
          detail: 'skipped (timeout)',
        }));
        resolve({
          name: task.name,
          status: 'timeout',
          duration,
          acceptance: acceptanceResults,
          agentOutput: stdout || undefined,
          error: 'task timed out',
        });
        return;
      }

      // Validate acceptance criteria
      const acceptanceResults = task.acceptance.map(c => validateCriterion(c, cwd));
      const allPassed = acceptanceResults.every(r => r.passed);

      resolve({
        name: task.name,
        status: code !== 0 ? 'error' : allPassed ? 'passed' : 'failed',
        duration,
        acceptance: acceptanceResults,
        agentOutput: stdout || undefined,
        error: code !== 0 ? `agent exited with code ${code}: ${stderr}` : undefined,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      const duration = Date.now() - startTime;
      resolve({
        name: task.name,
        status: 'error',
        duration,
        acceptance: task.acceptance.map(c => ({
          criterion: c.raw,
          passed: false,
          detail: 'skipped (agent error)',
        })),
        error: err.message,
      });
    });
  });
}

export async function runTasks(
  tasks: TaskSpec[],
  cwd: string,
  options: { parallel?: number; timeout?: number } = {}
): Promise<TaskResult[]> {
  if (!isClaudeAvailable()) {
    return tasks.map(t => ({
      name: t.name,
      status: 'error' as const,
      duration: 0,
      acceptance: t.acceptance.map(c => ({
        criterion: c.raw,
        passed: false,
        detail: 'skipped (claude CLI not found)',
      })),
      error: 'claude CLI not found in PATH. Install it: npm install -g @anthropic-ai/claude-code',
    }));
  }

  const parallel = options.parallel || 1;
  const results: TaskResult[] = [];
  const queue = [...tasks];

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const task = queue.shift();
      if (!task) break;
      const result = await runSingleTask(task, cwd, options.timeout);
      results.push(result);
    }
  }

  const workers = Array.from({ length: Math.min(parallel, tasks.length) }, () => worker());
  await Promise.all(workers);

  // Maintain original order
  return tasks.map(t => results.find(r => r.name === t.name)!);
}
