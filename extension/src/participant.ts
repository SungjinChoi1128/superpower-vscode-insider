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

// === Skill State Machine Infrastructure ===

interface SkillState {
    skillName: string;
    phase: string;
    turnCount: number;
    totalTurns: number;
    startedAt: string;
}

// Brainstorming phases
const BRAINSTORM_PHASES = {
    context: { minTurns: 1, maxTurns: 1, next: 'questions', noCode: true },
    questions: { minTurns: 2, maxTurns: 6, next: 'approaches', noCode: true },
    approaches: { minTurns: 1, maxTurns: 2, next: 'design', noCode: true },
    design: { minTurns: 1, maxTurns: 3, next: 'spec', noCode: true },
    spec: { minTurns: 1, maxTurns: 1, next: 'transition', noCode: true },
    transition: { minTurns: 1, maxTurns: 1, next: null, noCode: true }
};

// Writing-plans phases
const WRITING_PLANS_PHASES = {
    before: { minTurns: 1, maxTurns: 1, next: 'writing', noCode: true },
    writing: { minTurns: 1, maxTurns: 10, next: 'after', noCode: true },
    after: { minTurns: 1, maxTurns: 1, next: null, noCode: true }
};

// Executing-plans phases
const EXECUTING_PLANS_PHASES = {
    before: { minTurns: 1, maxTurns: 1, next: 'executing', noCode: false },
    executing: { minTurns: 1, maxTurns: 100, next: 'checkpoints', noCode: false },
    checkpoints: { minTurns: 1, maxTurns: 100, next: 'after', noCode: false },
    after: { minTurns: 1, maxTurns: 1, next: null, noCode: false }
};

// TDD phases (cyclical)
const TDD_PHASES = {
    before: { minTurns: 1, maxTurns: 1, next: 'red', noCode: true },
    red: { minTurns: 1, maxTurns: 1, next: 'green', noCode: false },
    green: { minTurns: 1, maxTurns: 1, next: 'refactor', noCode: false },
    refactor: { minTurns: 1, maxTurns: 2, next: 'red', noCode: false }
};

// Debugging phases
const DEBUGGING_PHASES = {
    reproduce: { minTurns: 1, maxTurns: 3, next: 'read-error', noCode: true },
    'read-error': { minTurns: 1, maxTurns: 1, next: 'hypothesis', noCode: true },
    hypothesis: { minTurns: 1, maxTurns: 2, next: 'verify', noCode: true },
    verify: { minTurns: 1, maxTurns: 3, next: 'fix', noCode: false },
    fix: { minTurns: 1, maxTurns: 3, next: 'verify-fix', noCode: false },
    'verify-fix': { minTurns: 1, maxTurns: 2, next: 'commit', noCode: false },
    commit: { minTurns: 1, maxTurns: 1, next: null, noCode: false }
};

// Verification phases
const VERIFICATION_PHASES = {
    before: { minTurns: 1, maxTurns: 1, next: 'definition-of-done', noCode: true },
    'definition-of-done': { minTurns: 1, maxTurns: 3, next: null, noCode: true }
};

// Requesting-review phases
const REQUESTING_REVIEW_PHASES = {
    before: { minTurns: 1, maxTurns: 1, next: 'self-review', noCode: true },
    'self-review': { minTurns: 1, maxTurns: 2, next: 'draft-pr', noCode: true },
    'draft-pr': { minTurns: 1, maxTurns: 1, next: null, noCode: true }
};

// Receiving-review phases
const RECEIVING_REVIEW_PHASES = {
    'stage-1': { minTurns: 1, maxTurns: 5, next: 'stage-2', noCode: true },
    'stage-2': { minTurns: 1, maxTurns: 3, next: 'response', noCode: true },
    response: { minTurns: 1, maxTurns: 5, next: null, noCode: true }
};

// Finishing-branch phases
const FINISHING_BRANCH_PHASES = {
    before: { minTurns: 1, maxTurns: 1, next: 'squash-decision', noCode: true },
    'squash-decision': { minTurns: 1, maxTurns: 1, next: 'create-pr', noCode: true },
    'create-pr': { minTurns: 1, maxTurns: 2, next: 'after', noCode: true },
    after: { minTurns: 1, maxTurns: 1, next: null, noCode: true }
};

// Skill to phases mapping
const SKILL_PHASES: Record<string, Record<string, { minTurns: number; maxTurns: number; next: string | null; noCode: boolean }>> = {
    brainstorming: BRAINSTORM_PHASES,
    'writing-plans': WRITING_PLANS_PHASES,
    'executing-plans': EXECUTING_PLANS_PHASES,
    tdd: TDD_PHASES,
    debugging: DEBUGGING_PHASES,
    verification: VERIFICATION_PHASES,
    'requesting-review': REQUESTING_REVIEW_PHASES,
    'receiving-review': RECEIVING_REVIEW_PHASES,
    'finishing-branch': FINISHING_BRANCH_PHASES
};

// Helper Functions

function getInitialPhase(skillName: string): string | null {
    const phases = SKILL_PHASES[skillName];
    if (!phases) return null;
    return Object.keys(phases)[0];
}

function getPhaseConfig(skillName: string, phase: string): { minTurns: number; maxTurns: number; next: string | null; noCode: boolean } | null {
    return SKILL_PHASES[skillName]?.[phase] || null;
}

function advancePhase(state: SkillState): SkillState {
    const config = getPhaseConfig(state.skillName, state.phase);
    if (!config || !config.next) return state;

    return {
        ...state,
        phase: config.next,
        turnCount: 0
    };
}

function isNoCodePhase(skillName: string, phase: string): boolean {
    const config = getPhaseConfig(skillName, phase);
    return config?.noCode || false;
}

// Code keywords that indicate user is requesting code generation
const CODE_KEYWORDS = ['function', 'def', 'class', 'import', 'implement', 'build', 'create_file', 'write_file', 'write code', 'generate code', 'show me code'];

function preprocessUserPrompt(prompt: string, state: SkillState): { blocked: boolean; prompt: string } {
    // Check if any code keyword exists in the prompt (case insensitive)
    const promptLower = prompt.toLowerCase();
    const hasCodeKeyword = CODE_KEYWORDS.some(keyword => promptLower.includes(keyword));

    // Check if currently in a no-code phase
    const inNoCodePhase = isNoCodePhase(state.skillName, state.phase);

    // If both conditions are true, block the request
    if (hasCodeKeyword && inNoCodePhase) {
        return {
            blocked: true,
            prompt: `BLOCKED: User requested code generation during "${state.phase}" phase. This is forbidden. User message was: ${prompt}`
        };
    }

    return { blocked: false, prompt };
}

function shouldAdvancePhase(state: SkillState): boolean {
    const config = getPhaseConfig(state.skillName, state.phase);
    if (!config) return false;
    return state.turnCount >= config.maxTurns;
}

function getPhaseReminder(state: SkillState): string {
    const config = getPhaseConfig(state.skillName, state.phase);
    if (!config) return '';

    const noCodeWarning = config.noCode ? '\n⛔ DO NOT WRITE ANY CODE IN THIS PHASE' : '';

    const phaseMessages: Record<string, Record<string, string>> = {
        brainstorming: {
            context: `🔒 PHASE: Explore Context (Turn ${state.turnCount}/${config.maxTurns})
Read project files, understand current state.
Ask ONE clarifying question.${noCodeWarning}`,
            questions: `🔒 PHASE: Clarifying Questions (Turn ${state.turnCount}/${config.maxTurns})
Ask exactly ONE question per message.
Do NOT propose approaches yet.${noCodeWarning}`,
            approaches: `🔒 PHASE: Propose Approaches (Turn ${state.turnCount}/${config.maxTurns})
Present 2-3 approaches with trade-offs.
Lead with your recommendation.${noCodeWarning}`,
            design: `🔒 PHASE: Present Design (Turn ${state.turnCount}/${config.maxTurns})
Cover: architecture, components, error handling, testing.
Get approval on each section.${noCodeWarning}`,
            spec: `🔒 PHASE: Write Spec Document
Create markdown file at docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md
Include all design decisions.${noCodeWarning}`,
            transition: `🔒 PHASE: Transition
Design is complete! Tell user to type: @sp /write-plan
Do NOT start implementing.${noCodeWarning}`
        },
        'writing-plans': {
            before: `🔒 PHASE: Before Writing (Turn ${state.turnCount}/${config.maxTurns})
Read spec document. Understand git context.
No code writing - only planning.${noCodeWarning}`,
            writing: `🔒 PHASE: Writing Plan (Turn ${state.turnCount}/${config.maxTurns})
Create TDD tasks with exact file paths and commands.
Each task: 2-5 minutes, failing test → implement → verify → commit.${noCodeWarning}`,
            after: `🔒 PHASE: Transition
Plan complete! Tell user to type: @sp /execute-plan
Summarize: number of tasks, estimated time.${noCodeWarning}`
        },
        'executing-plans': {
            before: `🔒 PHASE: Before Execution (Turn ${state.turnCount}/${config.maxTurns})
Confirm branch. Check for uncommitted changes.
Ask for plan file path.`,
            executing: `🔒 PHASE: Executing Tasks (Turn ${state.turnCount}/${config.maxTurns})
Follow steps exactly - do not skip or reorder.
Run verification commands. Commit at end of each task.`,
            checkpoints: `🔒 PHASE: Checkpoint (Turn ${state.turnCount}/${config.maxTurns})
Report: what completed, test status, git log, any deviations.
Wait for user acknowledgement before continuing.`,
            after: `🔒 PHASE: Transition
All tasks complete! Run full test suite.
Tell user to type: @sp /verify`
        },
        tdd: {
            before: `🔒 PHASE: Before TDD (Turn ${state.turnCount}/${config.maxTurns})
Find existing tests. Understand testing patterns.
Identify test framework configuration.`,
            red: `🔒 PHASE: RED - Write Failing Test (Turn ${state.turnCount}/${config.maxTurns})
Write test describing ONE behavior.
Run it - verify it fails with expected error (not import error).${noCodeWarning}`,
            green: `🔒 PHASE: GREEN - Make It Pass (Turn ${state.turnCount}/${config.maxTurns})
Write MINIMAL implementation to make test pass.
Run test - verify it passes.`,
            refactor: `🔒 PHASE: REFACTOR - Improve Code (Turn ${state.turnCount}/${config.maxTurns})
Improve code quality while keeping tests green.
Commit after refactor cycle.`
        },
        debugging: {
            reproduce: `🔒 PHASE: Reproduce (Turn ${state.turnCount}/${config.maxTurns})
Reproduce error in simplest possible way.
Find exact failing step and input.${noCodeWarning}`,
            'read-error': `🔒 PHASE: Read Full Error (Turn ${state.turnCount}/${config.maxTurns})
Read complete error message and stack trace.
For Spark: scroll past "Caused by" to root cause.${noCodeWarning}`,
            hypothesis: `🔒 PHASE: Form Hypothesis (Turn ${state.turnCount}/${config.maxTurns})
State hypothesis explicitly: "I think error is X because Y."${noCodeWarning}`,
            verify: `🔒 PHASE: Verify Hypothesis (Turn ${state.turnCount}/${config.maxTurns})
Check with smallest change: print/log, inspect data, check schema.
For PySpark: df.printSchema(), df.show(5), df.filter().count()`,
            fix: `🔒 PHASE: Fix (Turn ${state.turnCount}/${config.maxTurns})
Make minimal fix addressing ROOT cause.
Do NOT fix symptoms.`,
            'verify-fix': `🔒 PHASE: Verify Fix (Turn ${state.turnCount}/${config.maxTurns})
Run failing test again - confirm it passes.
Run full test suite - confirm nothing broke.`,
            commit: `🔒 PHASE: Commit
Commit with message explaining root cause:
"fix: handle null X in transformation\n\nRoot cause: Y"`
        },
        verification: {
            before: `🔒 PHASE: Before Verification (Turn ${state.turnCount}/${config.maxTurns})
Check git status. Show uncommitted changes if any.`,
            'definition-of-done': `🔒 PHASE: Definition of Done
Work is complete when ALL checked:
☐ All tests pass (output shown, not summarized)
☐ No linting errors
☐ Data quality assertions pass
☐ Git status clean
☐ Specific behavior works as described`
        },
        'requesting-review': {
            before: `🔒 PHASE: Before Review (Turn ${state.turnCount}/${config.maxTurns})
Git context: branch, commits since main, status.
All tests must pass first.`,
            'self-review': `🔒 PHASE: Self-Review Checklist (Turn ${state.turnCount}/${config.maxTurns})
PySpark/Python: clear responsibilities, error handling, no hardcoded values, tests cover behavior
SQL: no SELECT *, explicit joins, NULL handling, indexes considered
DAB/YAML: bundle validate passes, correct targets, no hardcoded paths
Azure Pipelines: runs successfully, correct connections, correct paths`,
            'draft-pr': `🔒 PHASE: Draft PR Description
Include: Summary (what/why), Test Plan (commands/output)`
        },
        'receiving-review': {
            'stage-1': `🔒 PHASE: Stage 1 - Spec Compliance Review (Turn ${state.turnCount}/${config.maxTurns})
FIRST: Read spec from docs/superpowers/specs/
Categorize each comment: Spec Violation (fix), Code Quality (verify), Suggestion (optional), Disagree (discuss)
Fix ALL spec violations before Stage 2.${noCodeWarning}`,
            'stage-2': `🔒 PHASE: Stage 2 - Code Quality Review (Turn ${state.turnCount}/${config.maxTurns})
After spec violations resolved:
☐ DRY - duplicated logic?
☐ YAGNI - handling impossible scenarios?
☐ Readability - clear names, no magic numbers?
☐ Edge cases - null handling covered?${noCodeWarning}`,
            response: `🔒 PHASE: Response (Turn ${state.turnCount}/${config.maxTurns})
Reply to each comment with: "Done - [what fixed]", "Discussed - [reasoning]", "Deferring - [reason]", or "Spec change needed"
Run full test suite before marking ready.${noCodeWarning}`
        },
        'finishing-branch': {
            before: `🔒 PHASE: Before PR (Turn ${state.turnCount}/${config.maxTurns})
Confirm: commits on branch, no uncommitted changes, all tests pass.
Run @sp /verify first.`,
            'squash-decision': `🔒 PHASE: Squash Decision (Turn ${state.turnCount}/${config.maxTurns})
Review git log --oneline main..HEAD
Clean story → keep commits
Messy/WIP commits → consider squashing
In doubt → keep individual commits`,
            'create-pr': `🔒 PHASE: Create PR (Turn ${state.turnCount}/${config.maxTurns})
Push: git push -u origin <branch>
Title: <type>: <what changed>
Description: Summary, Test Plan, Notes for Reviewer
Link ADO work item.`,
            after: `🔒 PHASE: After PR
Move ADO work item to "In Review"
Notify reviewers if required
Tell user: When feedback arrives, type @sp /receive-review`
        }
    };

    const skillMessages = phaseMessages[state.skillName];
    if (!skillMessages) return '';

    return skillMessages[state.phase] || '';
}

const WORKTREE_COMMANDS = new Set(['worktree', 'wt']);
const INFO_COMMANDS = new Set(['phase', 'state', 'reset']);

export function registerSpParticipant(
    context: vscode.ExtensionContext,
    skillsRoot: string
): void {
    const participant = vscode.chat.createChatParticipant(
        'sp.assistant',
        async (request, chatContext, stream, token) => {
            const command = request.command ?? '';
            const skillName = COMMAND_TO_SKILL[command];

            // Handle worktree commands specially - they execute directly
            if (WORKTREE_COMMANDS.has(command)) {
                await handleWorktreeCommand(request, stream);
                return;
            }

            // Handle info commands (phase, state, reset) - they don't load skills
            if (INFO_COMMANDS.has(command)) {
                await handleInfoCommand(command, stream);
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

            // Check if there's existing state for this skill
            const existingData = loadActiveSkillFile();
            let currentState: SkillState | null = null;

            // Check if this is a new skill (different from persisted)
            const isNewSkill = !existingData || existingData.skill !== skillName;

            if (isNewSkill) {
                // Reset state for new skill
                const initialPhase = getInitialPhase(skillName);
                if (initialPhase) {
                    currentState = {
                        skillName: skillName,
                        phase: initialPhase,
                        turnCount: 1,
                        totalTurns: 1,
                        startedAt: new Date().toISOString()
                    };
                }
            } else {
                // Continue existing session
                currentState = reconstructSkillState(existingData);
                if (currentState) {
                    currentState.turnCount++;
                    currentState.totalTurns++;

                    // Check if should advance phase
                    if (shouldAdvancePhase(currentState)) {
                        currentState = advancePhase(currentState);
                    }
                }
            }

            // Write active skill file with state
            writeActiveSkillFile(skillName, 'sp.assistant', currentState || undefined);

            // Run git commands to get project context
            const gitContext = await getGitContext();

            const memoryContent = loadMemory(getMemoryRoot());

            // Check if this is a follow-up message in a multi-turn conversation
            const isFollowUp = chatContext.history.length > 0;

            let messages: vscode.LanguageModelChatMessage[];

            if (isFollowUp) {
                // Multi-turn: include history and re-inject skill context
                // For follow-up turns, inject a continuation reminder based on current state
                const continuationReminder = currentState
                    ? `🔒 You are in the middle of the "${skillName}" skill.\n\n${getPhaseReminder(currentState)}\n\nContinue from where you left off.`
                    : `🔒 You are in the middle of the "${skillName}" skill. Continue from where you left off.`;

                // Apply input pre-processing: check for code keywords in no-code phases
                const preprocessed = currentState
                    ? preprocessUserPrompt(request.prompt, currentState)
                    : { blocked: false, prompt: request.prompt };

                // Check if blocked - return error without calling LLM
                if (preprocessed.blocked) {
                    const state = currentState!;
                    stream.markdown(`## ⛔ Blocked

${preprocessed.prompt}

**Current phase:** ${state.phase}
**Skill:** ${state.skillName}
**Turn:** ${state.turnCount}/${getPhaseConfig(state.skillName, state.phase)?.maxTurns || '?'}

Please continue with the current phase task, or use \`@sp /reset\` to start over.`);
                    return;
                }

                messages = [
                    // System context with skill instructions (re-injected for follow-ups)
                    vscode.LanguageModelChatMessage.User(
                        `${memoryContent}\n\n---\n\n## Project Context\n\n${gitContext}\n\n---\n\nYou are following the "${skillName}" skill. Here are the skill instructions:\n\n${skillContent}\n\n---\n\n${continuationReminder}`
                    ),
                    // Convert conversation history to LanguageModelChatMessage
                    ...convertHistoryToMessages(chatContext.history),
                    // Current user message
                    vscode.LanguageModelChatMessage.User(preprocessed.prompt)
                ];
            } else {
                // First turn: full context with skill and user request
                const phaseReminder = currentState ? getPhaseReminder(currentState) : '';

                // Apply input pre-processing: check for code keywords in no-code phases
                const preprocessed = currentState
                    ? preprocessUserPrompt(request.prompt, currentState)
                    : { blocked: false, prompt: request.prompt };

                // Check if blocked - return error without calling LLM
                if (preprocessed.blocked) {
                    const state = currentState!;
                    stream.markdown(`## ⛔ Blocked

${preprocessed.prompt}

**Current phase:** ${state.phase}
**Skill:** ${state.skillName}
**Turn:** ${state.turnCount}/${getPhaseConfig(state.skillName, state.phase)?.maxTurns || '?'}

Please continue with the current phase task, or use \`@sp /reset\` to start over.`);
                    return;
                }

                messages = [
                    vscode.LanguageModelChatMessage.User(
                        `${memoryContent}\n\n---\n\n## Project Context\n\n${gitContext}\n\n---\n\nYou are following the "${skillName}" skill. Here are the skill instructions:\n\n${skillContent}${phaseReminder ? '\n\n---\n\n' + phaseReminder : ''}\n\n---\n\nUser request: ${preprocessed.prompt}`
                    )
                ];
            }

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

function getCopilotRoot(): string {
    const homeDir = process.env.USERPROFILE || process.env.HOME || '';
    return path.join(homeDir, '.copilot');
}

function convertHistoryToMessages(history: readonly (vscode.ChatRequestTurn | vscode.ChatResponseTurn)[]): vscode.LanguageModelChatMessage[] {
    const messages: vscode.LanguageModelChatMessage[] = [];

    for (const turn of history) {
        if (turn instanceof vscode.ChatRequestTurn) {
            // User message
            messages.push(vscode.LanguageModelChatMessage.User(turn.prompt));
        } else if (turn instanceof vscode.ChatResponseTurn) {
            // Assistant response - flatten all response parts to text
            let responseText = '';
            for (const part of turn.response) {
                if (part instanceof vscode.ChatResponseMarkdownPart) {
                    responseText += part.value.value;
                } else if (part instanceof vscode.ChatResponseAnchorPart) {
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

function getMemoryRoot(): string {
    return path.join(getCopilotRoot(), 'memory');
}

interface ActiveSkillData {
    skill: string;
    timestamp: string;
    participantId: string;
    // State persistence fields
    phase?: string;
    turnCount?: number;
    totalTurns?: number;
    startedAt?: string;
}

function writeActiveSkillFile(skillName: string, participantId: string, state?: SkillState): void {
    const copilotRoot = getCopilotRoot();
    if (!fs.existsSync(copilotRoot)) {
        fs.mkdirSync(copilotRoot, { recursive: true });
    }

    const activeSkillData: ActiveSkillData = {
        skill: skillName,
        timestamp: new Date().toISOString(),
        participantId: participantId,
        // Add state if provided
        ...(state && {
            phase: state.phase,
            turnCount: state.turnCount,
            totalTurns: state.totalTurns,
            startedAt: state.startedAt
        })
    };

    const activeSkillPath = path.join(copilotRoot, 'active-skill.json');
    fs.writeFileSync(activeSkillPath, JSON.stringify(activeSkillData, null, 2), 'utf-8');
}

function loadActiveSkillFile(): ActiveSkillData | null {
    const activeSkillPath = path.join(getCopilotRoot(), 'active-skill.json');

    if (!fs.existsSync(activeSkillPath)) {
        return null;
    }

    try {
        const content = fs.readFileSync(activeSkillPath, 'utf-8');
        const data = JSON.parse(content) as ActiveSkillData;

        // Validate required fields
        if (!data.skill || !data.timestamp) {
            return null;
        }

        return data;
    } catch {
        // Corrupt or unreadable file
        return null;
    }
}

function reconstructSkillState(data: ActiveSkillData): SkillState | null {
    // Only reconstruct if we have all required state fields
    if (!data.phase || data.turnCount === undefined || !data.startedAt) {
        return null;
    }

    // Validate that this skill has phases
    const initialPhase = getInitialPhase(data.skill);
    if (!initialPhase) {
        return null; // Skill doesn't have phases
    }

    return {
        skillName: data.skill,
        phase: data.phase,
        turnCount: data.turnCount,
        totalTurns: data.totalTurns || data.turnCount,
        startedAt: data.startedAt
    };
}

function loadMemory(memoryRoot: string): string {
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

        const execOptions: ExecOptions = {
            cwd: workspacePath
        };

        exec('git log --oneline -10', execOptions, (err, stdout, stderr) => {
            if (err) {
                results.push(`## git log\nError: ${err.message}`);
            } else {
                const output = typeof stdout === 'string' ? stdout.trim() : '';
                results.push(`## git log --oneline -10\n${output}`);
            }
            checkDone();
        });

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

async function handleWorktreeCommand(request: vscode.ChatRequest, stream: vscode.ChatResponseStream): Promise<void> {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspacePath) {
        stream.markdown('No workspace folder open.');
        return;
    }

    const prompt = request.prompt.trim();

    if (prompt.startsWith('list')) {
        exec('git worktree list', { cwd: workspacePath }, (err, stdout, stderr) => {
            if (err) {
                stream.markdown(`Error listing worktrees: ${err.message}`);
            } else {
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
        exec(`git worktree remove ../${worktreeName}`, { cwd: workspacePath }, (err, stdout, stderr) => {
            if (err) {
                stream.markdown(`Error removing worktree: ${err.message}`);
            } else {
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

        exec(`git worktree list`, { cwd: workspacePath }, (err, stdout) => {
            if (stdout && stdout.includes(worktreeName)) {
                stream.markdown(`Worktree '${worktreeName}' already exists at ${worktreePath}`);
                return;
            }

            exec(`git worktree add ${worktreePath} -b ${branchName}`, { cwd: workspacePath }, (err, stdout, stderr) => {
                if (err) {
                    stream.markdown(`Error creating worktree: ${err.message}\n\n\`\`\`\n${stderr}\n\`\`\``);
                } else {
                    stream.markdown(`## Worktree Created Successfully\n\n**Location:** \`${worktreePath}\`\n**Branch:** \`${branchName}\`\n\nTo open in VS Code:\n\`\`\`\ncode "${worktreePath}"\n\`\`\``);
                }
            });
        });
        return;
    }

    stream.markdown(`## Git Worktrees\n\nManage isolated worktrees for feature development.\n\n**Commands:**\n- \`@sp /worktree list\` — Show all worktrees\n- \`@sp /worktree create <name> [-b <branch>]\` — Create new worktree with branch\n- \`@sp /worktree remove <name>\` — Remove a worktree`);
}

async function handleInfoCommand(command: string, stream: vscode.ChatResponseStream): Promise<void> {
    const activeData = loadActiveSkillFile();

    if (command === 'phase') {
        if (!activeData || !activeData.skill) {
            stream.markdown('**No active skill**\n\nStart a skill with `@sp /<command>` (e.g., `@sp /brainstorm`)');
            return;
        }
        const state = reconstructSkillState(activeData);
        if (!state) {
            stream.markdown('**No active skill**\n\nStart a skill with `@sp /<command>` (e.g., `@sp /brainstorm`)');
            return;
        }
        const config = getPhaseConfig(state.skillName, state.phase);
        const maxTurns = config?.maxTurns || '?';
        stream.markdown(`**Current:** \`${state.skillName}\` \u2192 \`${state.phase}\` (turn ${state.turnCount}/${maxTurns})`);
        return;
    }

    if (command === 'state') {
        if (!activeData || !activeData.skill) {
            stream.markdown('**No active skill state**\n\n```json\n{}\n```');
            return;
        }
        const state = reconstructSkillState(activeData);
        const displayState = state || {
            skill: activeData.skill,
            timestamp: activeData.timestamp,
            participantId: activeData.participantId,
            note: 'No phase state (skill may not use phases)'
        };
        stream.markdown('**Full State:**\n\n```json\n' + JSON.stringify(displayState, null, 2) + '\n```');
        return;
    }

    if (command === 'reset') {
        const copilotRoot = getCopilotRoot();
        const activeSkillPath = path.join(copilotRoot, 'active-skill.json');
        if (fs.existsSync(activeSkillPath)) {
            fs.unlinkSync(activeSkillPath);
        }
        stream.markdown('**State reset**\n\nActive skill state cleared. Start fresh with `@sp /<command>` (e.g., `@sp /brainstorm`)');
        return;
    }
}