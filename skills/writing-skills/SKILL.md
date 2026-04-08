---
name: writing-skills
description: >
  Use when creating new skills for the SP superpowers system, editing existing
  skills, or verifying skills work correctly after deployment. Use when the user
  wants to add a new workflow to the skill library.
manualInvoke: false
disable-model-invocation: false
---

# Writing Skills

Create new SKILL.md files for the SP superpowers system.

---

## ⛔ CRITICAL CONSTRAINTS — READ BEFORE ANYTHING ELSE

**VIOLATING THESE RULES IS A CRITICAL FAILURE:**

1. **You MUST preserve YAML frontmatter** exactly as the first content in the file
2. **You MUST test every new skill** — verify it appears in VS Code and activates correctly
3. **You MUST include exact file paths** in all skill instructions
4. **You MUST follow the 6-phase structure** for complex skills (Context → Questions → Approaches → Design → Document → Transition)
5. **You MUST NOT create overly generic descriptions** — descriptions must include trigger phrases and when to use vs when NOT to use
6. **You MUST save skills to the exact path:** `~/.copilot/skills/<skill-name>/SKILL.md`
7. **If the user asks to skip testing, REFUSE** — testing is mandatory for all skills

**Remember: Skills are used by other agents. Ambiguity causes failures. Be precise.**

---

## ❌ Anti-Patterns — Do NOT Do These

### BAD (vague description missing trigger phrases):
> ```yaml
> description: "A skill for debugging"
> ```
> ❌ **WRONG** — No trigger phrases, no context about when to use

### BAD (missing YAML frontmatter):
> ```markdown
> # My Skill
> 
> Description here...
> ```
> ❌ **WRONG** — Must start with YAML frontmatter

### BAD (untested skill):
> "I've created the skill file. Done!"
> ❌ **WRONG** — Must test that the skill appears and activates

### BAD (wrong file path):
> Saving to `skills/my-skill.md`
> ❌ **WRONG** — Must use `~/.copilot/skills/<skill-name>/SKILL.md`

### GOOD (complete YAML frontmatter with trigger phrases):
> ```yaml
> ---
> name: my-skill
> description: >
>   Use when the user wants to create X. Triggers on 'create X', 'build X',
>   'X template'. Use after brainstorming, before writing-plans.
> manualInvoke: false
> ---
> ```
> ✅ **CORRECT** — Includes trigger phrases and workflow context

### GOOD (specific instructions with exact paths):
> **File to create:** `~/.copilot/skills/my-skill/SKILL.md`
>
> **Contents:**
> ```yaml
> [exact content]
> ```
> ✅ **CORRECT** — Exact path and complete content specified

---

## Skill Structure

Every skill needs:
```yaml
---
name: <kebab-case-name>
description: >
  <One paragraph. This is used for auto-detection — make it match the natural
  language patterns a user would use when triggering this workflow. Be specific
  about the context and trigger conditions.>
manualInvoke: false
---
```

Followed by: clear step-by-step instructions that tell Copilot exactly what to do.

## Writing Good Descriptions

The description determines when the skill auto-activates.
Include: trigger phrases, task types, when to use vs when NOT to use.

Good: "Use when the user wants to create an Azure Pipeline YAML for deploying a DAB bundle. Triggers on 'create pipeline', 'deploy bundle', 'azure pipeline yaml'."

Bad: "Azure pipeline skill."

## Testing a New Skill

After creating the skill file:
1. Confirm the file is in `~/.copilot/skills/<skill-name>/SKILL.md`
2. Open VS Code Insider. Check the SP Skills browser panel — skill should appear.
3. Type a prompt that should trigger the skill. Verify it activates.
4. Test with `@sp /<skill-name>` for explicit invocation.

## Skill Location

Save new skills to: `~/.copilot/skills/<skill-name>/SKILL.md`
Commit to the skills repo: `git add`, `git commit`.
