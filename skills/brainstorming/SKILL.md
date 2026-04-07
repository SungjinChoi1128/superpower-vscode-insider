---
name: brainstorming
description: >
  Use before any creative work — designing data pipelines, lakehouse architecture,
  new features, components, or modifying behavior. Use when the user wants to plan
  or design something before building it. Explores intent, requirements, and design
  before any implementation begins. Required before writing-plans.
manualInvoke: false
---

# Brainstorming — Design Before Building

Turn ideas into fully formed designs through collaborative dialogue.
**ABSOLUTE RULE: Do NOT read, edit, or create any files unless explicitly told to do so.**

## Process (follow in order)

### 1. Explore Project Context (DO NOT READ FILES)

**IMPORTANT:** Git log and status have been automatically captured for this session. Display this context clearly to the user by saying:

> "Based on the project context I can see: [current branch, recent commits]"

**DO NOT read any files** — not README, not docs, not source code. Ask the user questions instead to understand the system.

If you need to understand something specific, ASK the user to describe it or show you the relevant code.

### 2. Ask Clarifying Questions

Ask ONE question at a time. Use multiple choice where possible.
Focus on: purpose, constraints, success criteria, tech stack specifics.

For data engineering tasks, consider asking about:
- Source system (MSSQL, flat files, APIs, streaming)
- Target (Bronze/Silver/Gold layer, specific Delta table)
- Data volume and SLA requirements
- Existing patterns in the codebase to follow
- ADO pipeline trigger requirements

### 3. Propose 2-3 Approaches

Present options with trade-offs. Lead with your recommendation and why.
For DE tasks, consider: complexity, reusability, testability, DAB compatibility.

### 4. Present Design

Cover in sections (get approval after each section):
- Architecture and data flow
- Components and their responsibilities
- Error handling and data quality approach
- Testing strategy
- ADO pipeline integration points

### 5. Write Spec Document

Save to: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
Commit the spec.

### 6. Transition

After spec is approved, you MUST explicitly:
1. Summarize what was designed
2. Tell the user: "Design is complete! To proceed with implementation, type `@sp /write-plan` to create the implementation plan."
3. Do NOT start implementing — wait for user to invoke the next skill

## Rules (Violations = Immediate Stop)

- **NEVER read files** — not README, not docs, not source code
- **NEVER edit files** — no creating, modifying, or deleting files
- **NEVER write code** — no implementation until design is fully approved
- **One question per message**
- **Always explore via questions, not file reading**

### If You Catch Yourself Wanting to Edit Code:
Stop immediately. Say: "I'm in brainstorming mode — I should be asking questions, not editing files. Let me continue the conversation instead."

## Model Behavior Note

If you find yourself wanting to read files to understand the codebase, ASK the user to describe what they need instead. Reading files during brainstorming leads to scope creep and premature implementation.
