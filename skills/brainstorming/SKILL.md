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

---

## ⛔ CRITICAL CONSTRAINTS — READ BEFORE ANYTHING ELSE

**VIOLATING THESE RULES IS A CRITICAL FAILURE:**

1. **You MUST NOT generate ANY code** (no code blocks, no scripts, no snippets, no pseudocode) until the design is explicitly approved
2. **You MUST ask exactly ONE question per message** during the questioning phase
3. **You MUST create a spec document** before transitioning — no exceptions
4. **You MUST end with the EXACT transition phrase** (see Phase 6)
5. **You MUST follow the phases IN ORDER** — do not skip phases
6. **If the user asks you to write code, REFUSE and redirect** back to design discussion
7. **You MUST get explicit approval** on each section of the design before proceeding

**Remember: Your role is to DESIGN, not to BUILD. Building comes AFTER the design is complete and approved.**

---

## ❌ Anti-Patterns — Do NOT Do These

### BAD (generating code during brainstorming):
> "Here's how we could implement this:"
> ```python
> def my_function():
>     pass
> ```
> ❌ **WRONG** — Never write code during brainstorming

### BAD (skipping the spec document):
> "Great, I think we have a good design. Let me start implementing..."
> ❌ **WRONG** — Must create spec document first

### BAD (asking multiple questions at once):
> "What volume of data? What's the source? What's the target?"
> ❌ **WRONG** — One question per message

### BAD (not following the transition format):
> "Should I start coding now?"
> ❌ **WRONG** — Must use exact transition phrase

### GOOD (asking a clarifying question):
> "**Question 3:** What volume of data are we expecting per day?"
> 
> Options:
> - A) Under 1GB
> - B) 1-10GB
> - C) Over 10GB
> ✅ **CORRECT** — One question with options

---

## Process (follow in order)

### Phase 1: Explore Project Context (Turn 1/1)

**Purpose:** Understand what exists before proposing anything new.

**What to do:**
1. Read: README.md, docs/ folder, existing configs
2. Display context to user:
   > "Based on the project context I can see: [branch name], [recent commits], [relevant files]"
3. Ask your first clarifying question

**Output format — you MUST produce exactly:**
```
> 📋 **Project Context**
> - Current branch: `[branch name]`
> - Recent commits: [summary of last 3-5 commits]
> - Key files: [relevant files you can see]
>
> Based on this context, my first question is:
>
> **[Your question here]?**
```

**Phase transition:** After 1 turn, automatically proceed to Phase 2.

---

### Phase 2: Clarifying Questions (Turns 1-6, max 6 turns)

**Purpose:** Gather requirements before proposing approaches.

**What to do:**
1. Ask exactly ONE question per message
2. Use multiple choice where possible
3. Focus on: purpose, constraints, success criteria, tech stack specifics
4. For DE tasks: source system, target, data volume, SLAs, existing patterns

**Output format — each turn MUST be:**
```
> Thank you for that clarification. [Brief acknowledgment of what you learned]
>
> **Question [N]: [Your question]?**
>
> Options:
> - A) [Option A]
> - B) [Option B]
> - C) [Option C]
```

**Rules:**
- One question per message ONLY
- Do NOT propose approaches yet
- Do NOT write any code

**Phase transition:** After 2-6 turns (min 2, max 6), when you have enough information, proceed to Phase 3.

---

### Phase 3: Propose Approaches (Turn 1/2)

**Purpose:** Present options with trade-offs and get user choice.

**What to do:**
1. Present 2-3 approaches with clear trade-offs
2. Lead with your recommendation and why
3. Ask user which approach they prefer

**Output format — you MUST produce:**
```
## Proposed Approaches

### Approach 1: [Name] ⭐ (Recommended)
**Description:** [2-3 sentences]
**Pros:**
- [pro 1]
- [pro 2]
**Cons:**
- [con 1]
- [con 2]

### Approach 2: [Name]
**Description:** [2-3 sentences]
**Pros:**
- [pro 1]
- [pro 2]
**Cons:**
- [con 1]
- [con 2]

**My recommendation is Approach [N] because [reason].**

**Which approach do you prefer, or would you like to modify one?**
```

**Rules:**
- Do NOT write any code
- Must present trade-offs honestly
- Must get explicit user choice

**Phase transition:** After user selects approach, proceed to Phase 4.

---

### Phase 4: Present Design (Turns 1-3, max 3 turns)

**Purpose:** Detail the chosen approach section by section.

**What to do:**
1. Present design in sections
2. Get approval on EACH section before proceeding
3. Cover: architecture, components, error handling, testing, ADO integration

**Section order:**
1. Architecture and data flow
2. Components and their responsibilities
3. Error handling and data quality approach
4. Testing strategy
5. ADO pipeline integration points

**Output format for each section:**
```
## Design Section [N]: [Section Name]

[Detailed description with diagrams if helpful]

**Key decisions:**
- [decision 1]
- [decision 2]

**Do you approve this section?** (Say "approved" to continue or provide feedback)
```

**Rules:**
- Do NOT write any code
- Must get explicit "approved" or feedback before next section
- If user provides feedback, address it before proceeding

**Phase transition:** After all sections approved, proceed to Phase 5.

---

### Phase 5: Write Spec Document (Turn 1/1)

**Purpose:** Create a permanent record of the design.

**What to do:**
1. Create markdown file at: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
2. Include all design decisions from the conversation
3. Use the exact file path format
4. Commit the spec

**Output format:**
```
## Spec Document Created

I have created the design spec at:
**`docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`**

**Contents include:**
- Goal and context
- Chosen approach with rationale
- Architecture overview
- Component details
- Error handling strategy
- Testing approach
- ADO pipeline integration

The spec has been committed with message: "docs: add <topic> design spec"
```

**Rules:**
- Must use exact path format
- Must commit the file
- Must include all design decisions

**Phase transition:** After spec is created and committed, proceed to Phase 6.

---

### Phase 6: Transition (Turn 1/1)

**Purpose:** Explicitly end brainstorming and hand off to implementation.

**What to do:**
1. Summarize what was designed
2. Tell user EXACTLY what to do next
3. Do NOT start implementing

**Output format — you MUST output EXACTLY this:**
```
✅ **Design Complete!**

**Summary of what we designed:**
- [Bullet summary of design]
- [Key decisions made]
- [Approach chosen]

**Spec location:** `docs/superpowers/specs/[filename]`

---

**🚀 To proceed with implementation, type:**

```
@sp /write-plan
```

**Do NOT start implementing. Wait for the write-plan skill.**
```

**Rules:**
- Must use EXACT format above
- Must NOT start implementing
- Must NOT write any code
- Must tell user to invoke `@sp /write-plan`

---

## Summary of Phase Gates

| Phase | Min Turns | Max Turns | No Code | Exit Criteria |
|-------|-----------|-----------|---------|---------------|
| 1. Context | 1 | 1 | ✅ | Display context, ask first question |
| 2. Questions | 2 | 6 | ✅ | Have enough information |
| 3. Approaches | 1 | 2 | ✅ | User selects approach |
| 4. Design | 1 | 3 | ✅ | All sections approved |
| 5. Spec | 1 | 1 | ✅ | Spec file created and committed |
| 6. Transition | 1 | 1 | ✅ | User told to invoke @sp /write-plan |

---

## Emergency Escape Hatches

If the user REALLY wants to skip ahead:

1. **"Just write the code"** → Refuse politely: "I can't write code during the design phase. Let's complete the design first, then I'll create a proper implementation plan."

2. **"Skip to the spec"** → If user already has clear requirements: "If you already have clear requirements, I can jump to Phase 5. What are the key design decisions I should document?"

3. **"I changed my mind"** → Allow going back: "No problem! Which phase would you like to revisit?"
