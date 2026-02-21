/**
 * Mechanics engine: dice rolling, skill checks, state patch application
 * Based on mechanics-spec.md
 */

import type { DifficultyLevel, SuccessLevel } from '../types/mechanics';
import type { GameState, StatePatch, CheckResult } from '../types/game';

/** Roll a single die (1 to sides) */
function rollSingleDie(sides: number): number {
    return Math.floor(Math.random() * sides) + 1;
}

/** Roll multiple dice: count × d(sides) + modifier */
export function rollDice(count: number, sides: number, modifier = 0): number {
    let total = modifier;
    for (let i = 0; i < count; i++) {
        total += rollSingleDie(sides);
    }
    return total;
}

/** Roll d100 (1–100) */
export function rollD100(): number {
    return Math.floor(Math.random() * 100) + 1;
}

/**
 * Calculate target value based on skill value and difficulty.
 * normal: skill value as-is
 * hard: skill / 2 (floor)
 * extreme: skill / 5 (floor)
 */
export function calculateTargetValue(skillValue: number, difficulty: DifficultyLevel): number {
    switch (difficulty) {
        case 'normal':
            return skillValue;
        case 'hard':
            return Math.floor(skillValue / 2);
        case 'extreme':
            return Math.floor(skillValue / 5);
    }
}

/**
 * Determine success level from d100 roll and skill value.
 * mechanics-spec.md §4.2
 */
export function calculateSuccessLevel(roll: number, skillValue: number): SuccessLevel {
    // Fumble: roll 100, or if skill ≤ 50 then 96–100
    if (roll === 100 || (skillValue <= 50 && roll >= 96)) {
        return 'fumble';
    }

    // Critical: roll 1
    if (roll === 1) {
        return 'critical';
    }

    // Extreme: roll ≤ skill / 5
    if (roll <= Math.floor(skillValue / 5)) {
        return 'extreme';
    }

    // Hard: roll ≤ skill / 2
    if (roll <= Math.floor(skillValue / 2)) {
        return 'hard';
    }

    // Regular: roll ≤ skill
    if (roll <= skillValue) {
        return 'regular';
    }

    return 'failure';
}

/**
 * Perform a full skill check: roll + evaluation
 */
export function performCheck(skillName: string, skillValue: number, difficulty: DifficultyLevel): CheckResult {
    const roll = rollD100();
    const targetValue = calculateTargetValue(skillValue, difficulty);
    const successLevel = calculateSuccessLevel(roll, skillValue);

    return {
        skill: skillName,
        targetValue,
        roll,
        successLevel,
    };
}

// ── Inventory limit ──
const INVENTORY_MAX = 10;

/**
 * Apply a StatePatch to a GameState with validation.
 * - Resources clamped to 0..max
 * - Duplicate flags prevented
 * - Inventory capped at INVENTORY_MAX
 * Returns [updatedState, summaryMessages]
 */
export function applyStatePatch(
    state: GameState,
    patch: StatePatch
): [GameState, string[]] {
    const next = structuredClone(state);
    const summaries: string[] = [];

    // Resources
    if (patch.resources) {
        if (patch.resources.currentHP !== undefined) {
            const delta = patch.resources.currentHP - next.pc.resources.currentHP;
            next.pc.resources.currentHP = Math.max(0, Math.min(next.pc.resources.maxHP, patch.resources.currentHP));
            summaries.push(`HP ${delta >= 0 ? '+' : ''}${delta}`);
        }
        if (patch.resources.currentSAN !== undefined) {
            const delta = patch.resources.currentSAN - next.pc.resources.currentSAN;
            next.pc.resources.currentSAN = Math.max(0, Math.min(next.pc.resources.maxSAN, patch.resources.currentSAN));
            summaries.push(`SAN ${delta >= 0 ? '+' : ''}${delta}`);
        }
        if (patch.resources.currentMP !== undefined) {
            const delta = patch.resources.currentMP - next.pc.resources.currentMP;
            next.pc.resources.currentMP = Math.max(0, Math.min(next.pc.resources.maxMP, patch.resources.currentMP));
            summaries.push(`MP ${delta >= 0 ? '+' : ''}${delta}`);
        }
    }

    // Flags add (prevent duplicates)
    if (patch.flagsAdd) {
        for (const flag of patch.flagsAdd) {
            if (!next.world.flags.includes(flag)) {
                next.world.flags.push(flag);
                summaries.push(`フラグ追加: ${flag}`);
            }
        }
    }

    // Flags remove
    if (patch.flagsRemove) {
        for (const flag of patch.flagsRemove) {
            const idx = next.world.flags.indexOf(flag);
            if (idx !== -1) {
                next.world.flags.splice(idx, 1);
                summaries.push(`フラグ解除: ${flag}`);
            }
        }
    }

    // Inventory add (capped)
    if (patch.inventoryAdd) {
        for (const item of patch.inventoryAdd) {
            if (next.pc.inventory.length < INVENTORY_MAX) {
                next.pc.inventory.push(item);
                summaries.push(`入手: ${item}`);
            }
        }
    }

    // Inventory remove
    if (patch.inventoryRemove) {
        for (const item of patch.inventoryRemove) {
            const idx = next.pc.inventory.indexOf(item);
            if (idx !== -1) {
                next.pc.inventory.splice(idx, 1);
                summaries.push(`消費: ${item}`);
            }
        }
    }

    // Objective
    if (patch.objective) {
        next.world.objective = patch.objective;
        summaries.push(`目的更新: ${patch.objective}`);
    }

    return [next, summaries];
}
