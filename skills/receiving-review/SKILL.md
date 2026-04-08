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

---

## ⛔ CRITICAL CONSTRAINTS — READ BEFORE ANYTHING ELSE

**VIOLATING THESE RULES IS A CRITICAL FAILURE:**

1. **Stage 1 (Spec Compliance) MUST complete before Stage 2 (Code Quality)** — Never mix or reverse the order
2. **Address blocking issues before style issues** — Spec violations take absolute priority
3. **You MUST verify EVERY suggestion is technically correct** before implementing — Do NOT blindly apply feedback
4. **You MUST respond to EVERY comment** using the exact response template format
5. **You MUST run full test suite** after all changes before marking PR ready
6. **You MUST NOT commit changes** that contradict the spec without explicit spec change approval
7. **You MUST invoke `@sp /verify`** before marking PR ready — No exceptions

**Remember: Review feedback is advisory, not authoritative. Verify before acting.**

---

## ❌ Anti-Patterns — Do NOT Do These

### BAD (implementing code quality fixes before spec compliance):
> "I'll refactor the variable names first, then look at the logic issue..."
> ❌ **WRONG** — Stage 1 (spec) MUST complete before Stage 2 (code quality)

### BAD (blindly applying all suggestions):
> "I've applied all the review feedback..."
> ❌ **WRONG** — Every suggestion must be verified for technical correctness first

### BAD (skipping the response template):
> "Fixed."
> ❌ **WRONG** — Must use exact response format: "Done — [what you fixed]"

### BAD (arguing without evidence):
> "I don't think that's right."
> ❌ **WRONG** — Disagreements require specific technical reasoning and evidence

### BAD (marking PR ready without verification):
> "All comments addressed, PR is ready."
> ❌ **WRONG** — MUST run full test suite and invoke `@sp /verify` first

### GOOD (categorizing before acting):
> **"Comment Analysis:**
> - Comment 1: Spec violation — will fix
> - Comment 2: Code quality — verifying correctness...
> - Comment 3: Suggestion — beneficial, will implement"
> ✅ **CORRECT** — Categorizes first, then acts in Stage order

### GOOD (using response template):
> **"Done — Renamed `data` to `user_data` for clarity in `auth.py:42`"**
> ✅ **CORRECT** — Uses exact format: "Done — [specific change made]"

### GOOD (disagreeing with evidence):
> **"Discussed — The suggested change would break the caching logic. According to the Python docs, `lru_cache` requires hashable arguments. The dict parameter cannot be made hashable without significant refactoring. Alternative: keep as-is or change spec to remove caching."**
> ✅ **CORRECT** — Provides specific technical reasoning with evidence

---

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
- **Stage 1 MUST be 100% complete before proceeding to Stage 2**

### For Code Quality / Suggestions
- Verify: Is this technically correct?
- Check side effects: Does fixing this break anything?
- If correct and beneficial: implement, test, commit
- If unsure: ask clarifying question
- If disagree: provide evidence and discuss
- **DO NOT touch these until ALL spec violations are resolved**

### For Disagreements
- Respond with specific technical reasoning
- Provide evidence (docs link, benchmark, counter-example)
- Do NOT change code just to avoid conflict
- Offer alternatives if appropriate

---

## Stage 2: Code Quality Review

**ONLY after all spec violations are resolved**, do a final code quality sweep:

- [ ] DRY — any duplicated logic that could be a utility?
- [ ] YAGNI — any code handling scenarios that can't happen?
- [ ] Readability — clear names, broken-down steps, no magic numbers?
- [ ] Edge cases — null handling, error cases covered?

**If new spec violations are discovered during Stage 2:**
- STOP Stage 2 immediately
- Return to Stage 1
- Fix spec violations first
- Then resume Stage 2

---

## Response Template — MANDATORY FORMAT

For each comment, respond with EXACTLY one of these formats:

- **"Done — [what you fixed]"** — You agreed and fixed it
  - Example: "Done — Added null check for `user_id` in `auth.py:42`"
  
- **"Discussed — [your reasoning]"** — You disagreed with evidence
  - Example: "Discussed — This would break the async flow. See Python docs on asyncio.gather() behavior."
  
- **"Deferring — [reason]"** — You'll address in a follow-up
  - Example: "Deferring — This requires schema migration, will handle in PR #123"
  
- **"Spec change needed"** — This requires updating the spec first
  - Example: "Spec change needed — The suggested API shape differs from approved spec. Need spec update first."

**Rules:**
- Use EXACT prefix: "Done —", "Discussed —", "Deferring —", or "Spec change needed"
- Be specific about what changed and where
- Include file paths and line numbers when relevant
- One response per comment — do not batch responses

---

## After All Comments Addressed

1. **Run full test suite** — Show output
2. **Reply to each comment** with resolution using the template above
3. **Invoke `@sp /verify`** before marking PR ready — No exceptions
4. **Verify no spec violations remain** — Do a final Stage 1 sweep

**DO NOT mark PR ready until:**
- All spec violations are fixed
- All comments have responses
- Full test suite passes
- `@sp /verify` has been invoked

---

## Summary of Stage Order

| Stage | Focus | Exit Criteria |
|-------|-------|---------------|
| **Stage 1** | Spec Compliance | All spec violations resolved |
| **Stage 2** | Code Quality | All quality issues addressed |
| **Final** | Verification | Tests pass, `@sp /verify` invoked |

**Critical: Stage 1 MUST complete before Stage 2. Never reverse or interleave stages.**
