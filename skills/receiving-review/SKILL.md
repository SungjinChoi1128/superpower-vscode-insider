---
name: receiving-review
description: >
  Use when receiving code review feedback on an ADO pull request or code review.
  Use before implementing any suggested changes. Requires technical rigor —
  verify suggestions are correct before applying them. Two-stage review: spec
  compliance first, then code quality.
manualInvoke: false
---

# Receiving Code Review — Two-Stage Review Process

Evaluate feedback before implementing it. Not all review comments are correct.

## Stage 1: Spec Compliance Review

**First, verify the spec compliance.** Before considering ANY code quality suggestions:

1. **Read the spec** — Pull up `docs/superpowers/specs/` for the feature being reviewed
2. **List all review comments** — Get the full list from the PR
3. **Categorize each comment:**

| Category | Meaning |
|----------|---------|
| **Spec Violation** | Implementation doesn't match the approved spec |
| **Code Quality** | Works correctly but could be cleaner/better |
| **Suggestion** | Nice to have but not required |
| **Disagree** | Reviewer is incorrect or misunderstanding something |

### For Spec Violations
- Acknowledge: "You're right, this violates the spec"
- Fix it — this is non-negotiable

### For Code Quality / Suggestions
- Verify: Is this technically correct?
- Check side effects: Does fixing this break anything?
- If correct and beneficial: implement, test, commit
- If unsure: ask clarifying question
- If disagree: provide evidence and discuss

### For Disagreements
- Respond with specific technical reasoning
- Provide evidence (docs link, benchmark, counter-example)
- Do NOT change code just to avoid conflict

## Stage 2: Code Quality Review

After all spec violations are resolved, do a final code quality sweep:

- [ ] DRY — any duplicated logic that could be a utility?
- [ ] YAGNI — any code handling scenarios that can't happen?
- [ ] Readability — clear names, broken-down steps, no magic numbers?
- [ ] Edge cases — null handling, error cases covered?

## Response Template

For each comment, respond with one of:

- **"Done — [what you fixed]"** — You agreed and fixed it
- **"Discussed — [your reasoning]"** — You disagreed with evidence
- **"Deferring — [reason]"** — You'll address in a follow-up
- **"Spec change needed"** — This requires updating the spec first

## After All Comments Addressed

Run full test suite. Show output.
Reply to each comment with resolution.
Invoke `@sp /verify` before marking PR ready.
