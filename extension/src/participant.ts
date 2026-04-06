import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec, ExecOptions } from 'child_process';

const COMMAND_TO_SKILL: Record<string, string> = {
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

export function registerSpParticipant(
    context: vscode.ExtensionContext,
    skillsRoot: string
): void {
    const participant = vscode.chat.createChatParticipant(
        'sp.assistant',
        async (request, _chatContext, stream, token) => {
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

            // Run git commands to get project context
            const gitContext = await getGitContext();

            const memoryContent = loadMemory(getMemoryRoot());
            const messages = [
                vscode.LanguageModelChatMessage.User(
                    `${memoryContent}\n\n---\n\n## Project Context\n\n${gitContext}\n\n---\n\nYou are following the "${skillName}" skill. Here are the skill instructions:\n\n${skillContent}\n\n---\n\nUser request: ${request.prompt}`
                )
            ];

            const response = await models[0].sendRequest(messages, {}, token);
            for await (const chunk of response.text) {
                stream.markdown(chunk);
            }
        }
    );

    participant.iconPath = new vscode.ThemeIcon('sparkle');
    context.subscriptions.push(participant);
}

function loadSkill(skillsRoot: string, skillName: string): string | null {
    const skillPath = path.join(skillsRoot, skillName, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
        return null;
    }
    return fs.readFileSync(skillPath, 'utf-8');
}

function getMemoryRoot(): string {
    const homeDir = process.env.USERPROFILE || process.env.HOME || '';
    return path.join(homeDir, '.copilot', 'memory');
}

function loadMemory(memoryRoot: string): string {
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
            } catch {
                // Skip if can't read directory
            }
        }
    }

    return memory;
}

async function getGitContext(): Promise<string> {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspacePath) {
        return 'No workspace folder open';
    }

    return new Promise((resolve) => {
        const results: string[] = [];
        let completed = 0;

        const checkDone = () => {
            completed++;
            if (completed === 2) {
                resolve(results.join('\n'));
            }
        };

        // Use cwd to set working directory
        const execOptions: ExecOptions = {
            cwd: workspacePath
        };

        // Run git log
        exec('git log --oneline -10', execOptions, (err, stdout, stderr) => {
            if (err) {
                results.push(`## git log\nError: ${err.message}`);
            } else {
                const output = typeof stdout === 'string' ? stdout.trim() : '';
                results.push(`## git log --oneline -10\n${output}`);
            }
            checkDone();
        });

        // Run git status
        exec('git status', execOptions, (err, stdout, stderr) => {
            if (err) {
                results.push(`## git status\nError: ${err.message}`);
            } else {
                const output = typeof stdout === 'string' ? stdout.trim() : '';
                results.push(`## git status\n${output}`);
            }
            checkDone();
        });
    });
}
