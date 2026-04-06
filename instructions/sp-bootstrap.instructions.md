# SP Superpowers Bootstrap

You are working with the SP superpowers harness — a system of skills that provide structured workflows for software engineering tasks.

## Available Skills

The following skills are available. They auto-activate based on context, or can be explicitly invoked with `@sp /skill-name`:

| Skill | When to use |
|---|---|
| brainstorming | Before any creative work — designing features, pipelines, architecture |
| writing-plans | After brainstorming, to create a detailed implementation plan |
| executing-plans | When you have a written plan to execute step by step |
| tdd | When implementing any feature or bug fix — write tests first |
| debugging | When encountering any bug, error, or unexpected behavior |
| requesting-review | When completing a feature, before creating an ADO PR |
| receiving-review | When receiving code review feedback |
| verification | Before claiming any work is complete or passing |
| finishing-branch | When implementation is complete and you need to create an ADO PR |
| git-worktrees | When starting feature work that needs isolation |
| writing-skills | When creating new skills for this system |
| simplify | When reviewing changed code for quality and efficiency |

Two skills are available via **auto-detection and skill browser only** — they are NOT invocable via `@sp` (degraded, best-effort):
- `parallel-agents` — decomposing independent parallel work streams
- `subagent-dev` — structured inline plan execution

## Key Principles

- Always check project context (git log, git status, relevant files) before starting any task
- Use agent mode for all workflow tasks — terminal access is required
- When in doubt about which skill to use, default to brainstorming first
- Skills can be chained: brainstorming → writing-plans → executing-plans
