import * as vscode from 'vscode';
import { registerSpParticipant } from './participant';
import { SkillBrowserProvider } from './skillBrowser';
import { registerScaffoldCommand } from './scaffolder';

export function activate(context: vscode.ExtensionContext): void {
    const skillsRoot = getSkillsRoot();

    registerSpParticipant(context, skillsRoot);
    const browserProvider = new SkillBrowserProvider(skillsRoot);
    vscode.window.registerTreeDataProvider('spSkillBrowser', browserProvider);
    registerScaffoldCommand(context, skillsRoot);
}

export function deactivate(): void {}

function getSkillsRoot(): string {
    const homeDir = process.env.USERPROFILE || process.env.HOME || '';
    return require('path').join(homeDir, '.copilot', 'skills');
}
