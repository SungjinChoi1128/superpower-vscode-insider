import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface SkillInfo {
    name: string;
    description: string;
    degraded: boolean;
    skillPath: string;
}

const DEGRADED_SKILLS = new Set(['parallel-agents', 'subagent-dev']);

export class SkillBrowserProvider implements vscode.TreeDataProvider<SkillItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<SkillItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private skillsRoot: string) {}

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: SkillItem): vscode.TreeItem {
        return element;
    }

    getChildren(): SkillItem[] {
        if (!fs.existsSync(this.skillsRoot)) {
            return [new SkillItem({ name: 'Skills not found', description: `Check ${this.skillsRoot}`, degraded: false, skillPath: '' })];
        }

        return fs.readdirSync(this.skillsRoot)
            .filter(dir => fs.existsSync(path.join(this.skillsRoot, dir, 'SKILL.md')))
            .map(dir => {
                const skillPath = path.join(this.skillsRoot, dir, 'SKILL.md');
                const description = extractDescription(skillPath);
                return new SkillItem({
                    name: dir,
                    description,
                    degraded: DEGRADED_SKILLS.has(dir),
                    skillPath
                });
            });
    }
}

class SkillItem extends vscode.TreeItem {
    constructor(skill: SkillInfo) {
        const label = skill.degraded ? `${skill.name} (degraded)` : skill.name;
        super(label, vscode.TreeItemCollapsibleState.None);
        this.tooltip = skill.description;
        this.description = skill.description.slice(0, 60) + (skill.description.length > 60 ? '…' : '');
        this.iconPath = new vscode.ThemeIcon(skill.degraded ? 'warning' : 'sparkle');
        if (skill.skillPath) {
            this.command = {
                command: 'vscode.open',
                title: 'Open Skill',
                arguments: [vscode.Uri.file(skill.skillPath)]
            };
        }
    }
}

function extractDescription(skillPath: string): string {
    try {
        const content = fs.readFileSync(skillPath, 'utf-8');
        const match = content.match(/description:\s*>\s*([\s\S]*?)(?=\n\w|\n---)/);
        return match ? match[1].replace(/\s+/g, ' ').trim() : 'No description';
    } catch {
        return 'Could not read skill';
    }
}
