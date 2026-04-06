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
exports.SkillBrowserProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DEGRADED_SKILLS = new Set(['parallel-agents', 'subagent-dev']);
class SkillBrowserProvider {
    skillsRoot;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    constructor(skillsRoot) {
        this.skillsRoot = skillsRoot;
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren() {
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
exports.SkillBrowserProvider = SkillBrowserProvider;
class SkillItem extends vscode.TreeItem {
    constructor(skill) {
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
function extractDescription(skillPath) {
    try {
        const content = fs.readFileSync(skillPath, 'utf-8');
        const match = content.match(/description:\s*>\s*([\s\S]*?)(?=\n\w|\n---)/);
        return match ? match[1].replace(/\s+/g, ' ').trim() : 'No description';
    }
    catch {
        return 'Could not read skill';
    }
}
//# sourceMappingURL=skillBrowser.js.map