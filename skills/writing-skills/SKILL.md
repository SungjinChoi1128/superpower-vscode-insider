---
name: writing-skills
description: >
  Use when creating new skills for the SP superpowers system, editing existing
  skills, or verifying skills work correctly after deployment. Use when the user
  wants to add a new workflow to the skill library.
manualInvoke: false
---

# Writing Skills

Create new SKILL.md files for the SP superpowers system.

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
