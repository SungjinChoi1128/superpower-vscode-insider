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
exports.registerSpParticipant = registerSpParticipant;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const COMMAND_TO_SKILL = {
    'brainstorm': 'brainstorming',
    'write-plan': 'writing-plans',
    'execute-plan': 'executing-plans',
    'tdd': 'tdd',
    'debug': 'debugging',
    'request-review': 'requesting-review',
    'receive-review': 'receiving-review',
    'verify': 'verification',
    'finish-branch': 'finishing-branch',
    'worktree': 'git-worktrees',
    'write-skill': 'writing-skills',
    'simplify': 'simplify',
};
const WORKTREE_COMMANDS = new Set(['worktree', 'wt']);
function registerSpParticipant(context, skillsRoot) {
    const participant = vscode.chat.createChatParticipant('sp.assistant', async (request, _chatContext, stream, token) => {
        const command = request.command ?? '';
        const skillName = COMMAND_TO_SKILL[command];
        // Handle worktree commands directly
        if (WORKTREE_COMMANDS.has(command)) {
            await handleWorktreeCommand(request, stream);
            return;
        }
        if (!skillName) {
            stream.markdown('Available skills:\n');
            for (const cmd of Object.keys(COMMAND_TO_SKILL)) {
                stream.markdown(`- @sp /${cmd}\n`);
            }
            return;
        }
        const skillContent = loadSkill(skillsRoot, skillName);
        if (!skillContent) {
            stream.markdown(`Skill not found: ${skillName}`);
            return;
        }
        const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
        if (!models.length) {
            stream.markdown('No language model available.');
            return;
        }
        // Get git context
        const gitContext = await getGitContext();
        const memoryContent = loadMemory(getMemoryRoot());
        // Build prompt with explicit rules
        const systemPrompt = `${memoryContent}

---
## Project Context
${gitContext}
---
## CRITICAL RULES FOR THIS SKILL
${skillContent}
---
Remember: Follow the skill instructions exactly. Do NOT write any code unless the skill explicitly says to do so after design approval.
---
User request: ${request.prompt}`;
        const messages = [
            vscode.LanguageModelChatMessage.User(systemPrompt)
        ];
        const response = await models[0].sendRequest(messages, {}, token);
        for await (const chunk of response.text) {
            stream.markdown(chunk);
        }
    });
    participant.iconPath = new vscode.ThemeIcon('sparkle');
    context.subscriptions.push(participant);
}
function loadSkill(skillsRoot, skillName) {
    const skillPath = path.join(skillsRoot, skillName, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
        return null;
    }
    return fs.readFileSync(skillPath, 'utf-8');
}
function getCopilotRoot() {
    const homeDir = process.env.USERPROFILE || process.env.HOME || '';
    return path.join(homeDir, '.copilot');
}
function getMemoryRoot() {
    return path.join(getCopilotRoot(), 'memory');
}
function loadMemory(memoryRoot) {
    const indexPath = path.join(memoryRoot, 'MEMORY.md');
    if (!fs.existsSync(indexPath)) {
        return '';
    }
    let memory = `## Your Memory\n\n${fs.readFileSync(indexPath, 'utf-8')}`;
    const types = ['user', 'feedback', 'project', 'reference'];
    for (const type of types) {
        const typeDir = path.join(memoryRoot, type);
        if (fs.existsSync(typeDir)) {
            try {
                const files = fs.readdirSync(typeDir);
                for (const file of files) {
                    if (file.endsWith('.md')) {
                        const filePath = path.join(typeDir, file);
                        const content = fs.readFileSync(filePath, 'utf-8');
                        memory += `\n\n## ${type}/${file}\n${content}`;
                    }
                }
            }
            catch {
                // Skip
            }
        }
    }
    return memory;
}
async function getGitContext() {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspacePath) {
        return 'No workspace folder open';
    }
    return new Promise((resolve) => {
        const results = [];
        let completed = 0;
        const checkDone = () => {
            completed++;
            if (completed === 2) {
                resolve(results.join('\n'));
            }
        };
        const execOptions = { cwd: workspacePath };
        (0, child_process_1.exec)('git log --oneline -10', execOptions, (err, stdout) => {
            if (err) {
                results.push('## git log\nError');
            }
            else {
                const output = typeof stdout === 'string' ? stdout.trim() : '';
                results.push(`## git log --oneline -10\n${output}`);
            }
            checkDone();
        });
        (0, child_process_1.exec)('git status', execOptions, (err, stdout) => {
            if (err) {
                results.push('## git status\nError');
            }
            else {
                const output = typeof stdout === 'string' ? stdout.trim() : '';
                results.push(`## git status\n${output}`);
            }
            checkDone();
        });
    });
}
async function handleWorktreeCommand(request, stream) {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspacePath) {
        stream.markdown('No workspace folder open.');
        return;
    }
    const prompt = request.prompt.trim();
    if (prompt.startsWith('list')) {
        (0, child_process_1.exec)('git worktree list', { cwd: workspacePath }, (err, stdout) => {
            if (err) {
                stream.markdown(`Error: ${err.message}`);
            }
            else {
                const output = typeof stdout === 'string' ? stdout.trim() : '';
                stream.markdown(`## Git Worktrees\n\n\`\`\`\n${output}\n\`\`\`\n`);
            }
        });
        return;
    }
    if (prompt.startsWith('remove ') || prompt.startsWith('delete ')) {
        const parts = prompt.split(' ');
        const worktreeName = parts[1];
        if (!worktreeName) {
            stream.markdown('Usage: @sp /worktree remove <name>');
            return;
        }
        (0, child_process_1.exec)(`git worktree remove ../${worktreeName}`, { cwd: workspacePath }, (err, stdout, stderr) => {
            if (err) {
                stream.markdown(`Error: ${err.message}`);
            }
            else {
                stream.markdown(`Worktree '${worktreeName}' removed.`);
            }
        });
        return;
    }
    if (prompt.startsWith('create ') || prompt.startsWith('new ')) {
        const parts = prompt.split(' ').filter(p => p.trim());
        const worktreeName = parts[1];
        const branch = parts[2] === '-b' ? parts[3] : undefined;
        if (!worktreeName) {
            stream.markdown(`## Create Worktree\n\nUsage: @sp /worktree create <name> [-b <branch>]\n\nExamples:\n- @sp /worktree create my-feature -b feature/my-feature\n- @sp /worktree create my-feature main`);
            return;
        }
        const branchName = branch || `feature/${worktreeName}`;
        const worktreePath = `../${worktreeName}`;
        (0, child_process_1.exec)(`git worktree add ${worktreePath} -b ${branchName}`, { cwd: workspacePath }, (err, stdout, stderr) => {
            if (err) {
                stream.markdown(`Error: ${err.message}\n\n\`\`\`\n${stderr}\n\`\`\``);
            }
            else {
                stream.markdown(`## Worktree Created\n\n**Location:** \`${worktreePath}\`\n**Branch:** \`${branchName}\`\n\nTo open: \`code "${worktreePath}"\``);
            }
        });
        return;
    }
    stream.markdown(`## Git Worktrees\n\n- @sp /worktree list\n- @sp /worktree create <name> [-b <branch>]\n- @sp /worktree remove <name>`);
}
//# sourceMappingURL=participant.js.map