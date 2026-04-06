---
name: receiving-review
description: >
  Use when receiving code review feedback on an ADO pull request or code review.
  Use before implementing any suggested changes. Requires technical rigor —
  verify suggestions are correct before applying them.
manualInvoke: false
---

# Receiving Code Review

Evaluate feedback before implementing it. Not all review comments are correct.

## Before Responding

Read ALL comments first before changing anything.
Group them: must-fix, should-fix, consider, disagree.

## For Each Suggestion

Before implementing:
1. **Understand it** — what problem is the reviewer solving?
2. **Verify it** — is the suggestion technically correct for this codebase?
3. **Check for side effects** — does applying it break anything?

For DE-specific suggestions, verify:
- PySpark API suggestions: confirm the API exists in the installed Spark version
- SQL rewrites: test performance with `EXPLAIN` or query stats before accepting
- Schema changes: trace all downstream consumers before agreeing

## Responding

For suggestions you agree with: implement, test, commit.

For suggestions you disagree with:
- Respond with specific technical reasoning
- Provide evidence (docs link, benchmark, counter-example)
- Do not change code just to avoid conflict

For suggestions you are unsure about:
- Ask a clarifying question on the PR
- Do not implement until you understand

## After Implementing All Changes

Run full test suite. Show output.
Reply to each comment: "Done — [what you did]" or "Discussed — [resolution]".
Invoke `@sp /verify` before marking PR ready.
