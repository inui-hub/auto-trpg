/**
 * Game state types based on functional-spec.md
 */

import type { Abilities, DerivedValues, DifficultyLevel, SuccessLevel } from './mechanics';

// ── Session ──

export type SessionPhase = 'introduction' | 'middle' | 'climax' | 'ending';

export interface Session {
    sessionId: string;
    sceneIndex: number;
    phase: SessionPhase;
    summary: string;
    outline: string;      // Non-public, full scenario outline
    guidance: string;     // Shortened version of outline for LLM
    theme: string;        // User-specified theme/mood
}

// ── Player Character ──

export interface PCProfile {
    name: string;
    occupation: string;
    age: string;
    gender: string;
    traits: string;
}

export interface PCResources {
    currentSAN: number;
    maxSAN: number;
    currentHP: number;
    maxHP: number;
    currentMP: number;
    maxMP: number;
}

export interface PC {
    profile: PCProfile;
    abilities: Abilities;
    derived: DerivedValues;
    skills: Record<string, number>;  // skill name → current total value
    resources: PCResources;
    inventory: string[];
}

// ── World ──

export interface NPC {
    name: string;
    relationship: string;
    status: string;
}

export interface World {
    objective: string;
    flags: string[];
    npcs: NPC[];
}

// ── Log ──

export type MessageType = 'gm' | 'player' | 'system';

export interface LogMessage {
    id: string;
    type: MessageType;
    text: string;
    timestamp: number;
}

export interface GameLog {
    messages: LogMessage[];
}

// ── Complete Game State ──

export interface GameState {
    session: Session;
    pc: PC;
    world: World;
    log: GameLog;
}

// ── LLM I/O types (functional-spec.md §3.5) ──

export interface CheckRequest {
    skill: string;
    difficulty: DifficultyLevel;
    purpose: string;
    failureHint: string;
}

export interface StatePatch {
    resources?: Partial<{
        currentSAN: number;
        currentHP: number;
        currentMP: number;
    }>;
    flagsAdd?: string[];
    flagsRemove?: string[];
    inventoryAdd?: string[];
    inventoryRemove?: string[];
    objective?: string;
}

export type EndSignalType = 'success' | 'fail' | 'time_up';

export interface EndSignal {
    type: EndSignalType;
    reason: string;
}

export interface LLMResponse {
    playerFacingText: string;
    choices?: string[];
    checkRequest?: CheckRequest;
    statePatch?: StatePatch;
    endSignal?: EndSignal;
}

// ── Initial scenario generation response ──

export interface InitialScenarioResponse {
    outline: string;
    guidance: string;
    introductionText: string;
    objective: string;
    initialFlags: string[];
    initialInventory: string[];
}

// ── Result ──

export interface SessionResult {
    endType: EndSignalType;
    summary: string;
    gains: string[];
    losses: string[];
    finalResources: PCResources;
    finalFlags: string[];
}

// ── Check result (sent back to LLM) ──

export interface CheckResult {
    skill: string;
    targetValue: number;
    roll: number;
    successLevel: SuccessLevel;
}
