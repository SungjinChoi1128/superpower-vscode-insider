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
    const participant = vscode.chat.createChatParticipant('sp.assistant', async (request, chatContext, stream, token) => {
        const command = request.command ?? '';
        const skillName = COMMAND_TO_SKILL[command];
        // Handle worktree commands specially - they execute directly
        if (WORKTREE_COMMANDS.has(command)) {
            await handleWorktreeCommand(request, stream);
            return;
        }
        if (!skillName) {
            stream.markdown('Unknown command. Available skills:\n');
            for (const cmd of Object.keys(COMMAND_TO_SKILL)) {
                stream.markdown(`- \`@sp /${cmd}\`\n`);
            }
            return;
        }
        const skillContent = loadSkill(skillsRoot, skillName);
        if (!skillContent) {
            stream.markdown(`Skill \`${skillName}\` not found at \`${skillsRoot}/${skillName}/SKILL.md\`.`);
            return;
        }
        const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
        if (!models.length) {
            stream.markdown('No language model available.');
            return;
        }
        // Write active skill file for external tracking
        writeActiveSkillFile(skillName, 'sp.assistant');
        // Run git commands to get project context
        const gitContext = await getGitContext();
        const memoryContent = loadMemory(getMemoryRoot());
        // Check if this is a follow-up message in a multi-turn conversation
        const isFollowUp = chatContext.history.length > 0;
        let messages;
        if (isFollowUp) {
            // Multi-turn: include history and re-inject skill context
            messages = [
                // System context with skill instructions (re-injected for follow-ups)
                vscode.LanguageModelChatMessage.User(`${memoryContent}\n\n---\n\n## Project Context\n\n${gitContext}\n\n---\n\nYou are following the "${skillName}" skill. Here are the skill instructions:\n\n${skillContent}`),
                // Convert conversation history to LanguageModelChatMessage
                ...convertHistoryToMessages(chatContext.history),
                // Current user message
                vscode.LanguageModelChatMessage.User(request.prompt)
            ];
        }
        else {
            // First turn: full context with skill and user request
            messages = [
                vscode.LanguageModelChatMessage.User(`${memoryContent}\n\n---\n\n## Project Context\n\n${gitContext}\n\n---\n\nYou are following the "${skillName}" skill. Here are the skill instructions:\n\n${skillContent}\n\n---\n\nUser request: ${request.prompt}`)
            ];
        }
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
function convertHistoryToMessages(history) {
    const messages = [];
    for (const turn of history) {
        if (turn instanceof vscode.ChatRequestTurn) {
            // User message
            messages.push(vscode.LanguageModelChatMessage.User(turn.prompt));
        }
        else if (turn instanceof vscode.ChatResponseTurn) {
            // Assistant response - flatten all response parts to text
            let responseText = '';
            for (const part of turn.response) {
                if (part instanceof vscode.ChatResponseMarkdownPart) {
                    responseText += part.value.value;
                }
                else if (part instanceof vscode.ChatResponseAnchorPart) {
                    // Skip anchor parts in context
                }
            }
            if (responseText) {
                messages.push(vscode.LanguageModelChatMessage.Assistant(responseText));
            }
        }
    }
    return messages;
}
function getMemoryRoot() {
    return path.join(getCopilotRoot(), 'memory');
}
function writeActiveSkillFile(skillName, participantId) {
    const copilotRoot = getCopilotRoot();
    if (!fs.existsSync(copilotRoot)) {
        fs.mkdirSync(copilotRoot, { recursive: true });
    }
    const activeSkillData = {
        skill: skillName,
        timestamp: new Date().toISOString(),
        participantId: participantId
    };
    const activeSkillPath = path.join(copilotRoot, 'active-skill.json');
    fs.writeFileSync(activeSkillPath, JSON.stringify(activeSkillData, null, 2), 'utf-8');
}
function loadMemory(memoryRoot) {
    const indexPath = path.join(memoryRoot, 'MEMORY.md');
    if (!fs.existsSync(indexPath)) {
        return '';
    }
    let memory = `## Your Memory (from ~/.copilot/memory/MEMORY.md)\n\n${fs.readFileSync(indexPath, 'utf-8')}`;
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
                // Skip if can't read directory
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
        const execOptions = {
            cwd: workspacePath
        };
        (0, child_process_1.exec)('git log --oneline -10', execOptions, (err, stdout, stderr) => {
            if (err) {
                results.push(`## git log\nError: ${err.message}`);
            }
            else {
                const output = typeof stdout === 'string' ? stdout.trim() : '';
                results.push(`## git log --oneline -10\n${output}`);
            }
            checkDone();
        });
        (0, child_process_1.exec)('git status', execOptions, (err, stdout, stderr) => {
            if (err) {
                results.push(`## git status\nError: ${err.message}`);
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
        (0, child_process_1.exec)('git worktree list', { cwd: workspacePath }, (err, stdout, stderr) => {
            if (err) {
                stream.markdown(`Error listing worktrees: ${err.message}`);
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
            stream.markdown('Please specify the worktree to remove. Usage: `@sp /worktree remove <name>`');
            return;
        }
        (0, child_process_1.exec)(`git worktree remove ../${worktreeName}`, { cwd: workspacePath }, (err, stdout, stderr) => {
            if (err) {
                stream.markdown(`Error removing worktree: ${err.message}`);
            }
            else {
                stream.markdown(`Worktree '${worktreeName}' removed successfully.`);
            }
        });
        return;
    }
    if (prompt.startsWith('create ') || prompt.startsWith('new ')) {
        const parts = prompt.split(' ').filter(p => p.trim());
        const worktreeName = parts[1];
        const branch = parts[2] === '-b' ? parts[3] : undefined;
        if (!worktreeName) {
            stream.markdown(`## Create Git Worktree\n\nUsage: \`@sp /worktree create <name> [-b <branch-name>]\`\n\nExamples:\n- \`@sp /worktree create my-feature -b feature/my-feature\` — create new branch\n- \`@sp /worktree create my-feature main\` — from existing main branch`);
            return;
        }
        const branchName = branch || `feature/${worktreeName}`;
        const worktreePath = `../${worktreeName}`;
        (0, child_process_1.exec)(`git worktree list`, { cwd: workspacePath }, (err, stdout) => {
            if (stdout && stdout.includes(worktreeName)) {
                stream.markdown(`Worktree '${worktreeName}' already exists at ${worktreePath}`);
                return;
            }
            (0, child_process_1.exec)(`git worktree add ${worktreePath} -b ${branchName}`, { cwd: workspacePath }, (err, stdout, stderr) => {
                if (err) {
                    stream.markdown(`Error creating worktree: ${err.message}\n\n\`\`\`\n${stderr}\n\`\`\``);
                }
                else {
                    stream.markdown(`## Worktree Created Successfully\n\n**Location:** \`${worktreePath}\`\n**Branch:** \`${branchName}\`\n\nTo open in VS Code:\n\`\`\`\ncode "${worktreePath}"\n\`\`\``);
                }
            });
        });
        return;
    }
    stream.markdown(`## Git Worktrees\n\nManage isolated worktrees for feature development.\n\n**Commands:**\n- \`@sp /worktree list\` — Show all worktrees\n- \`@sp /worktree create <name> [-b <branch>]\` — Create new worktree with branch\n- \`@sp /worktree remove <name>\` — Remove a worktree`);
}
//# sourceMappingURL=participant.js.map