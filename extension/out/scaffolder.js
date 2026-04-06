"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerScaffoldCommand = registerScaffoldCommand;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
function registerScaffoldCommand(context, skillsRoot) {
    const command = vscode.commands.registerCommand('sp.newSkill', async () => {
        const skillName = await vscode.window.showInputBox({
            prompt: 'Skill name (kebab-case, e.g. my-new-skill)',
            validateInput: v => /^[a-z0-9-]+$/.test(v) ? null : 'Use lowercase letters, numbers, and hyphens only'
        });
        if (!skillName)
            return;
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
//# sourceMappingURL=scaffolder.js.map