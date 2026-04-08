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
const SKILL_PHASES = {
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
function getInitialPhase(skillName) {
    const phases = SKILL_PHASES[skillName];
    if (!phases)
        return null;
    return Object.keys(phases)[0];
}
function getPhaseConfig(skillName, phase) {
    return SKILL_PHASES[skillName]?.[phase] || null;
}
function advancePhase(state) {
    const config = getPhaseConfig(state.skillName, state.phase);
    if (!config || !config.next)
        return state;
    return {
        ...state,
        phase: config.next,
        turnCount: 0
    };
}
function isNoCodePhase(skillName, phase) {
    const config = getPhaseConfig(skillName, phase);
    return config?.noCode || false;
}
// Code keywords that indicate user is requesting code generation
const CODE_KEYWORDS = ['function', 'def', 'class', 'import', 'implement', 'build', 'create_file', 'write_file', 'write code', 'generate code', 'show me code'];
function preprocessUserPrompt(prompt, state) {
    const promptLower = prompt.toLowerCase();
    const hasCodeKeyword = CODE_KEYWORDS.some(keyword => promptLower.includes(keyword));
    const inNoCodePhase = isNoCodePhase(state.skillName, state.phase);
    if (hasCodeKeyword && inNoCodePhase) {
        return `⚠️ WARNING: You appear to be requesting code in ${state.phase} phase. DO NOT generate code yet.\n\n${prompt}`;
    }
    return prompt;
}
function shouldAdvancePhase(state) {
    const config = getPhaseConfig(state.skillName, state.phase);
    if (!config)
        return false;
    return state.turnCount >= config.maxTurns;
}
// Extract spec file path from prompt (format: docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md)
function extractSpecFilePath(prompt) {
    const specPattern = /docs\/superpowers\/specs\/[\d]{4}-[\d]{2}-[\d]{2}-[a-zA-Z0-9-_]+\.md/;
    const match = prompt.match(specPattern);
    return match ? match[0] : undefined;
}
// Extract plan file path from prompt (format: docs/superpowers/plans/YYYY-MM-DD-<feature>.md)
function extractPlanFilePath(prompt) {
    const planPattern = /docs\/superpowers\/plans\/[\d]{4}-[\d]{2}-[\d]{2}-[a-zA-Z0-9-_]+\.md/;
    const match = prompt.match(planPattern);
    return match ? match[0] : undefined;
}
function getPhaseReminder(state) {
    const config = getPhaseConfig(state.skillName, state.phase);
    if (!config)
        return '';
    const phaseMessages = {
        brainstorming: {
            context: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** brainstorming
**Current Phase:** ${state.phase}
**Your Exact Task:** Read project files, understand current state. Ask ONE clarifying question.
**Do NOT:** Write code, skip to design, ask multiple questions at once
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            questions: (() => {
                const questionsLeft = config.maxTurns - state.turnCount;
                const shouldWrapUp = questionsLeft <= 1;
                return `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** brainstorming
**Current Phase:** ${state.phase}
**Your Exact Task:** Ask ONE focused question. Do NOT skip to design.
**Do NOT:** Suggest solutions, write code, ask vague or compound questions
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns} - ${shouldWrapUp ? '⛔ WRAP UP - Propose approaches after this question!' : `${questionsLeft} questions remaining`}

Remember: You MUST follow this skill exactly. No exceptions.`;
            })(),
            approaches: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** brainstorming
**Current Phase:** ${state.phase}
**Your Exact Task:** Propose 2-3 approaches with trade-offs. Lead with your recommendation.
**Do NOT:** Write code, skip to detailed design, pick solution for user
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            design: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** brainstorming
**Current Phase:** ${state.phase}
**Your Exact Task:** Present detailed design for approval. Cover architecture, components, error handling, testing.
**Do NOT:** Start implementing, skip sections, skip approval
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            spec: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** brainstorming
**Current Phase:** ${state.phase}
**Your Exact Task:** Create spec document at docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md
**Do NOT:** Implement code, deviate from spec format, skip documentation
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            transition: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** brainstorming
**Current Phase:** ${state.phase}
**Your Exact Task:** Tell user to type @sp /write-plan. Do NOT start implementing.
**Do NOT:** Write code, create files, skip telling user about next step
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`
        },
        'writing-plans': {
            before: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** writing-plans
**Current Phase:** ${state.phase}
**Your Exact Task:** Read spec document. Understand git context. Prepare to create TDD tasks.
**Do NOT:** Write code, skip spec review, start implementing
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            writing: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** writing-plans
**Current Phase:** ${state.phase}
**Your Exact Task:** Create TDD tasks with exact file paths and commands. Each task: 2-5 minutes, failing test → implement → verify → commit.
**Do NOT:** Write implementation code, skip verification steps, rush through tasks
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            after: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** writing-plans
**Current Phase:** ${state.phase}
**Your Exact Task:** Tell user to type @sp /execute-plan. Summarize number of tasks and estimated time.
**Do NOT:** Start executing, write code, skip transition
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`
        },
        'executing-plans': {
            before: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** executing-plans
**Current Phase:** ${state.phase}
**Your Exact Task:** Confirm branch. Check for uncommitted changes. Ask for plan file path.
**Do NOT:** Modify files, skip checks, start implementing
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            executing: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** executing-plans
**Current Phase:** ${state.phase}
**Your Exact Task:** Follow steps exactly - do not skip or reorder. Run verification commands. Commit at end of each task.
**Do NOT:** Skip steps, reorder tasks, skip verification, skip commits
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            checkpoints: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** executing-plans
**Current Phase:** ${state.phase}
**Your Exact Task:** Report what completed, test status, git log, any deviations. Wait for user acknowledgement before continuing.
**Do NOT:** Skip reporting, continue without acknowledgement, skip git log
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            after: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** executing-plans
**Current Phase:** ${state.phase}
**Your Exact Task:** All tasks complete! Run full test suite. Tell user to type: @sp /verify
**Do NOT:** Skip test suite, skip verification, declare complete without testing
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`
        },
        tdd: {
            before: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** tdd
**Current Phase:** ${state.phase}
**Your Exact Task:** Find existing tests. Understand testing patterns. Identify test framework configuration.
**Do NOT:** Write implementation code, skip test exploration, skip patterns review
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            red: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** tdd
**Current Phase:** ${state.phase}
**Your Exact Task:** Write test describing ONE behavior. Run it - verify it fails with expected error (not import error).
**Do NOT:** Write implementation code, write multiple tests, skip running tests
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            green: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** tdd
**Current Phase:** ${state.phase}
**Your Exact Task:** Write MINIMAL implementation to make test pass. Run test - verify it passes.
**Do NOT:** Over-implement, add extra features, skip test verification
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            refactor: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** tdd
**Current Phase:** ${state.phase}
**Your Exact Task:** Improve code quality while keeping tests green. Commit after refactor cycle.
**Do NOT:** Add new features, skip tests, skip commits
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`
        },
        debugging: {
            reproduce: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** debugging
**Current Phase:** ${state.phase}
**Your Exact Task:** Reproduce error in simplest possible way. Find exact failing step and input.
**Do NOT:** Guess at root cause, skip reproduction, implement fixes
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            'read-error': `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** debugging
**Current Phase:** ${state.phase}
**Your Exact Task:** Read complete error message and stack trace. For Spark: scroll past "Caused by" to root cause.
**Do NOT:** Skip error reading, guess at fix, skip stack trace analysis
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            hypothesis: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** debugging
**Current Phase:** ${state.phase}
**Your Exact Task:** State hypothesis explicitly: "I think error is X because Y."
**Do NOT:** Implement fix without hypothesis, skip hypothesis formation, guess randomly
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            verify: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** debugging
**Current Phase:** ${state.phase}
**Your Exact Task:** Check with smallest change: print/log, inspect data, check schema. For PySpark: df.printSchema(), df.show(5), df.filter().count()
**Do NOT:** Make big changes, skip verification, implement without checking
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            fix: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** debugging
**Current Phase:** ${state.phase}
**Your Exact Task:** Make minimal fix addressing ROOT cause. Do NOT fix symptoms.
**Do NOT:** Add workarounds, skip root cause, add unrelated changes
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            'verify-fix': `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** debugging
**Current Phase:** ${state.phase}
**Your Exact Task:** Run failing test again - confirm it passes. Run full test suite - confirm nothing broke.
**Do NOT:** Skip tests, skip full suite, declare complete without verification
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            commit: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** debugging
**Current Phase:** ${state.phase}
**Your Exact Task:** Commit with message explaining root cause: "fix: handle null X in transformation\n\nRoot cause: Y"
**Do NOT:** Commit without explanation, skip commit, use generic message
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`
        },
        verification: {
            before: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** verification
**Current Phase:** ${state.phase}
**Your Exact Task:** Check git status. Show uncommitted changes if any.
**Do NOT:** Skip git status, declare complete with uncommitted changes, modify files
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            'definition-of-done': `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** verification
**Current Phase:** ${state.phase}
**Your Exact Task:** Work is complete when ALL checked: ☐ All tests pass (output shown, not summarized) ☐ No linting errors ☐ Data quality assertions pass ☐ Git status clean ☐ Specific behavior works as described
**Do NOT:** Skip any checklist item, summarize test output, skip verification commands
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`
        },
        'requesting-review': {
            before: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** requesting-review
**Current Phase:** ${state.phase}
**Your Exact Task:** Git context: branch, commits since main, status. All tests must pass first.
**Do NOT:** Submit without tests passing, skip git context, skip branch review
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            'self-review': `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** requesting-review
**Current Phase:** ${state.phase}
**Your Exact Task:** Self-review checklist: PySpark/Python: clear responsibilities, error handling, no hardcoded values, tests cover behavior | SQL: no SELECT *, explicit joins, NULL handling, indexes considered | DAB/YAML: bundle validate passes, correct targets, no hardcoded paths | Azure Pipelines: runs successfully, correct connections, correct paths
**Do NOT:** Skip checklist items, skip self-review, submit with issues
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            'draft-pr': `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** requesting-review
**Current Phase:** ${state.phase}
**Your Exact Task:** Draft PR with: Summary (what/why), Test Plan (commands/output)
**Do NOT:** Submit without test plan, skip summary, use vague descriptions
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`
        },
        'receiving-review': {
            'stage-1': `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** receiving-review
**Current Phase:** ${state.phase}
**Your Exact Task:** FIRST: Read spec from docs/superpowers/specs/ | Categorize each comment: Spec Violation (fix), Code Quality (verify), Suggestion (optional), Disagree (discuss) | Fix ALL spec violations before Stage 2
**Do NOT:** Skip spec reading, skip categorization, skip spec violations
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            'stage-2': `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** receiving-review
**Current Phase:** ${state.phase}
**Your Exact Task:** After spec violations resolved: ☐ DRY - duplicated logic? ☐ YAGNI - handling impossible scenarios? ☐ Readability - clear names, no magic numbers? ☐ Edge cases - null handling covered?
**Do NOT:** Skip checklist items, skip stage 2, rush through review
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            response: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** receiving-review
**Current Phase:** ${state.phase}
**Your Exact Task:** Reply to each comment with: "Done - [what fixed]", "Discussed - [reasoning]", "Deferring - [reason]", or "Spec change needed" | Run full test suite before marking ready
**Do NOT:** Skip replies, skip test suite, skip any comment
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`
        },
        'finishing-branch': {
            before: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** finishing-branch
**Current Phase:** ${state.phase}
**Your Exact Task:** Confirm: commits on branch, no uncommitted changes, all tests pass. Run @sp /verify first.
**Do NOT:** Skip verification, skip checks, proceed with uncommitted changes
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            'squash-decision': `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** finishing-branch
**Current Phase:** ${state.phase}
**Your Exact Task:** Review git log --oneline main..HEAD | Clean story → keep commits | Messy/WIP commits → consider squashing | In doubt → keep individual commits
**Do NOT:** Skip log review, force squash without reason, skip decision
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            'create-pr': `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** finishing-branch
**Current Phase:** ${state.phase}
**Your Exact Task:** Push: git push -u origin <branch> | Title: <type>: <what changed> | Description: Summary, Test Plan, Notes for Reviewer | Link ADO work item.
**Do NOT:** Skip ADO link, skip test plan in description, use vague title
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`,
            after: `## ⛔⛔⛔ ACTIVE SKILL ENFORCEMENT ⛔⛔⛔

**Skill:** finishing-branch
**Current Phase:** ${state.phase}
**Your Exact Task:** Move ADO work item to "In Review" | Notify reviewers if required | Tell user: When feedback arrives, type @sp /receive-review
**Do NOT:** Skip ADO update, skip notification, skip next steps explanation
**If user asks for code:** REFUSE with "No code in ${state.phase} phase"
**Progress:** ${state.turnCount}/${config.maxTurns}

Remember: You MUST follow this skill exactly. No exceptions.`
        }
    };
    const skillMessages = phaseMessages[state.skillName];
    if (!skillMessages)
        return '';
    return skillMessages[state.phase] || '';
}
const WORKTREE_COMMANDS = new Set(['worktree', 'wt']);
const INFO_COMMANDS = new Set(['phase', 'state', 'reset']);
function registerSpParticipant(context, skillsRoot) {
    const participant = vscode.chat.createChatParticipant('sp.assistant', async (request, chatContext, stream, token) => {
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
        let currentState = null;
        // Check if this is a follow-up message in a multi-turn conversation
        const isFollowUp = chatContext.history.length > 0;
        // Only continue existing state if there's conversation history
        const isContinuation = existingData && existingData.skill === skillName && isFollowUp;
        const isNewSkill = !isContinuation;
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
        }
        else {
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
        // Extract file paths from prompt if mentioned
        const specPathFromPrompt = extractSpecFilePath(request.prompt);
        const planPathFromPrompt = extractPlanFilePath(request.prompt);
        // Write active skill file with state and extracted paths
        writeActiveSkillFile(skillName, 'sp.assistant', currentState || undefined, specPathFromPrompt, planPathFromPrompt);
        // Run git commands to get project context
        const gitContext = await getGitContext();
        const memoryContent = loadMemory(getMemoryRoot());
        let messages;
        if (isFollowUp) {
            // Multi-turn: include history and re-inject skill context
            // For follow-up turns, inject a continuation reminder based on current state
            const continuationReminder = currentState
                ? `🔒 You are in the middle of the "${skillName}" skill.\n\n${getPhaseReminder(currentState)}\n\nContinue from where you left off.`
                : `🔒 You are in the middle of the "${skillName}" skill. Continue from where you left off.`;
            // Apply input pre-processing: check for code keywords in no-code phases
            const preprocessedPrompt = currentState
                ? preprocessUserPrompt(request.prompt, currentState)
                : request.prompt;
            messages = [
                // System context with skill instructions (re-injected for follow-ups)
                vscode.LanguageModelChatMessage.User(`${memoryContent}\n\n---\n\n## Git Context\n\n${gitContext}\n\n---\n\n## 🚨 REMEMBER - YOU ARE IN PHASE: ${currentState?.phase?.toUpperCase() || 'UNKNOWN'}\n\n**Current task:** ${currentState ? getPhaseReminder(currentState).split('\n')[0] : 'Follow skill instructions'}\n\n**DO NOT:** Skip phases, write code prematurely, ignore reminders\n**DO:** Complete current phase before proceeding\n\n---\n\n## Skill Instructions:\n\n${skillContent}\n\n---\n\n${continuationReminder}`),
                // Convert conversation history to LanguageModelChatMessage
                ...convertHistoryToMessages(chatContext.history),
                // Current user message
                vscode.LanguageModelChatMessage.User(preprocessedPrompt)
            ];
        }
        else {
            // First turn: full context with skill and user request
            const phaseReminder = currentState ? getPhaseReminder(currentState) : '';
            // Apply input pre-processing: check for code keywords in no-code phases
            const preprocessedPrompt = currentState
                ? preprocessUserPrompt(request.prompt, currentState)
                : request.prompt;
            messages = [
                vscode.LanguageModelChatMessage.User(`${memoryContent}\n\n---\n\n## Git Context\n\n${gitContext}\n\n---\n\n## 🚨 CRITICAL INSTRUCTION\n\nYou are in **${currentState?.phase?.toUpperCase() || 'CONTEXT'}** phase.\n\n**YOUR IMMEDIATE TASK:** ${currentState?.phase === 'context' ? 'Read the context above. Ask the user ONE specific question to clarify their request. Do NOT propose solutions, do NOT write any code.' : 'Follow the skill instructions below.'}\n\n**DO NOT:** Skip to implementation, write code, propose solutions\n**DO:** Focus on the current phase task only\n\n---\n\n## Skill Instructions (MUST FOLLOW):\n\n${skillContent}${phaseReminder ? '\n\n---\n\n' + phaseReminder : ''}\n\n---\n\n## User's Message:\n${preprocessedPrompt}`)
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
function writeActiveSkillFile(skillName, participantId, state, specFilePath, planFilePath) {
    const copilotRoot = getCopilotRoot();
    if (!fs.existsSync(copilotRoot)) {
        fs.mkdirSync(copilotRoot, { recursive: true });
    }
    // Load existing data to preserve file paths if not explicitly provided
    const existingData = loadActiveSkillFile();
    const activeSkillData = {
        skill: skillName,
        timestamp: new Date().toISOString(),
        participantId: participantId,
        // Add state if provided
        ...(state && {
            phase: state.phase,
            turnCount: state.turnCount,
            totalTurns: state.totalTurns,
            startedAt: state.startedAt
        }),
        // Preserve existing paths or use provided ones
        specFilePath: specFilePath ?? existingData?.specFilePath,
        planFilePath: planFilePath ?? existingData?.planFilePath
    };
    const activeSkillPath = path.join(copilotRoot, 'active-skill.json');
    fs.writeFileSync(activeSkillPath, JSON.stringify(activeSkillData, null, 2), 'utf-8');
}
function loadActiveSkillFile() {
    const activeSkillPath = path.join(getCopilotRoot(), 'active-skill.json');
    if (!fs.existsSync(activeSkillPath)) {
        return null;
    }
    try {
        const content = fs.readFileSync(activeSkillPath, 'utf-8');
        const data = JSON.parse(content);
        // Validate required fields
        if (!data.skill || !data.timestamp) {
            return null;
        }
        return data;
    }
    catch {
        // Corrupt or unreadable file
        return null;
    }
}
function reconstructSkillState(data) {
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
async function handleInfoCommand(command, stream) {
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
//# sourceMappingURL=participant.js.map