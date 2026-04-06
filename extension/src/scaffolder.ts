import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const SKILL_TEMPLATE = `---
name: {skill-name}
description: >
  Use when [describe the trigger conditions and when this skill should activate].
  Include specific phrases and contexts that indicate this skill is needed.
manualInvoke: false
---

# {Skill Title}

[Brief description of what this skill does.]

## Before Starting

Check project context:
\`\`\`
git log --oneline -10
git status
\`\`\`

## Process

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Rules

- [Rule 1]
- [Rule 2]
`;

export function registerScaffoldCommand(
    context: vscode.ExtensionContext,
    skillsRoot: string
): void {
    const command = vscode.commands.registerCommand('sp.newSkill', async () => {
        const skillName = await vscode.window.showInputBox({
            prompt: 'Skill name (kebab-case, e.g. my-new-skill)',
            validateInput: v => /^[a-z0-9-]+$/.test(v) ? null : 'Use lowercase letters, numbers, and hyphens only'
        });

        if (!skillName) return;

        const skillDir = path.join(skillsRoot, skillName);
        const skillFile = path.join(skillDir, 'SKILL.md');

        if (fs.existsSync(skillFile)) {
            vscode.window.showErrorMessage(`Skill "${skillName}" already exists.`);
            return;
        }

        fs.mkdirSync(skillDir, { recursive: true });
        const content = SKILL_TEMPLATE
            .replace(/{skill-name}/g, skillName)
            .replace(/{Skill Title}/g, skillName.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '));
        fs.writeFileSync(skillFile, content, 'utf-8');

        const doc = await vscode.workspace.openTextDocument(skillFile);
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage(`Skill "${skillName}" created. Edit SKILL.md and save.`);
    });

    context.subscriptions.push(command);
}
