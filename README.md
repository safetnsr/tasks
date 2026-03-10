# tasks

open source copilot tasks — define coding tasks as markdown, run with any agent, get a report.

## install

```
npx @safetnsr/tasks init
```

## usage

define tasks in `.tasks/*.md`:

```markdown
---
name: add-auth
timeout: 600
---

## task
Add JWT auth middleware to the Express server.

## context
- src/server.ts
- src/routes/

## acceptance
- [ ] src/middleware/auth.ts exists
- [ ] src/middleware/auth.ts > 20 lines
- [ ] test:pass
```

run them:

```
npx @safetnsr/tasks run --parallel 2
```

```
┌──────────────┬────────┬──────────┬─────────────┐
│ task         │ status │ duration │ acceptance  │
├──────────────┼────────┼──────────┼─────────────┤
│ add-auth     │ ✓ pass │ 45s      │ 3/3         │
│ fix-tests    │ ✓ pass │ 22s      │ 2/2         │
│ add-logging  │ ✗ fail │ 60s      │ 1/3         │
│ refactor-db  │ ✓ pass │ 38s      │ 4/4         │
│ update-docs  │ ⏱ timeout │ 300s │ 0/2         │
└──────────────┴────────┴──────────┴─────────────┘

summary: 3/5 passed | 1 failed | 1 timeout | 165s total
```

## commands

| command | description |
|---------|-------------|
| `tasks init` | scaffold .tasks/ directory with example |
| `tasks run` | execute all tasks and validate |
| `tasks report` | show results from last run |
| `tasks list` | list all task specs |

## flags

| flag | description | default |
|------|-------------|---------|
| `--parallel N` | run N tasks simultaneously | 1 |
| `--timeout N` | per-task timeout in seconds | 600 |
| `--json` | output as JSON | false |
| `--format` | report format (terminal/json/md) | terminal |

## agent interface (--json)

```json
{
  "tasks": [
    {
      "name": "add-auth",
      "status": "passed",
      "duration": 45000,
      "acceptance": [
        { "criterion": "src/middleware/auth.ts exists", "passed": true }
      ]
    }
  ],
  "summary": { "total": 5, "passed": 3, "failed": 1, "errors": 0, "duration": 165000 }
}
```

## pair with

- `@safetnsr/vet` — audit the code your tasks generated
- `@safetnsr/pinch` — track what the tasks cost
- `@safetnsr/spend-cap` — set a budget cap for task runs
