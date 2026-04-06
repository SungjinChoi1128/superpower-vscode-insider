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
function registerSpParticipant(context, skillsRoot) {
    const participant = vscode.chat.createChatParticipant('sp.assistant', async (request, _chatContext, stream, token) => {
        const skillName = COMMAND_TO_SKILL[request.command ?? ''];
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
        const memoryContent = loadMemory(getMemoryRoot());
        const messages = [
            vscode.LanguageModelChatMessage.User(`${memoryContent}\n\n---\n\nYou are following the "${skillName}" skill. Here are the skill instructions:\n\n${skillContent}\n\n---\n\nUser request: ${request.prompt}`)
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
function getMemoryRoot() {
    const homeDir = process.env.USERPROFILE || process.env.HOME || '';
    return path.join(homeDir, '.copilot', 'memory');
}
function loadMemory(memoryRoot) {
    // Load memory index
    const indexPath = path.join(memoryRoot, 'MEMORY.md');
    if (!fs.existsSync(indexPath)) {
        return '';
    }
    let memory = `## Your Memory (from ~/.copilot/memory/MEMORY.md)\n\n${fs.readFileSync(indexPath, 'utf-8')}`;
    // Also load individual memory files
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
//# sourceMappingURL=participant.js.map