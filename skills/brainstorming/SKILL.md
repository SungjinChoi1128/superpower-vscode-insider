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
Do NOT write any code or implementation until design is approved.

## Process (follow in order)

### 1. Explore Project Context

**IMPORTANT:** Git log and status have been automatically captured for this session. They are included in your context below. Display this context clearly to the user by saying:

> "Based on the project context I can see: [summarize what you found - current branch, recent commits, any relevant files]"

Then ask your first clarifying question.

Read relevant docs: README.md, any docs/ folder, existing pipeline configs, DAB configs.
Understand what exists before proposing anything new.

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

After spec is approved, invoke: `@sp /write-plan`

## Rules

- One question per message
- NEVER write code before design is approved
- Always explore project context first
- For large projects covering multiple independent subsystems, decompose first
