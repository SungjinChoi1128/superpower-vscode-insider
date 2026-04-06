import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

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

            const messages = [
                vscode.LanguageModelChatMessage.User(
                    `You are following the "${skillName}" skill. Here are the skill instructions:\n\n${skillContent}\n\n---\n\nUser request: ${request.prompt}`
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
