/**
 * Game state context shared across all pages.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { GameState, LogMessage, StatePatch } from '../types/game';
import { applyStatePatch } from '../services/mechanics';

type StateUpdater = GameState | ((prev: GameState | null) => GameState | null);

interface GameContextValue {
    state: GameState | null;
    setState: (stateOrUpdater: StateUpdater) => void;
    updateWithPatch: (patch: StatePatch) => string[];
    addLogMessage: (msg: Omit<LogMessage, 'id' | 'timestamp'>) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

let messageIdCounter = 0;

export function GameProvider({ children }: { children: ReactNode }) {
    const [state, setStateInternal] = useState<GameState | null>(null);

    const setState = useCallback((stateOrUpdater: StateUpdater) => {
        if (typeof stateOrUpdater === 'function') {
            setStateInternal(stateOrUpdater);
        } else {
            setStateInternal(stateOrUpdater);
        }
    }, []);

    const updateWithPatch = useCallback((patch: StatePatch): string[] => {
        let summaries: string[] = [];
        setStateInternal((prev) => {
            if (!prev) return prev;
            const [next, sums] = applyStatePatch(prev, patch);
            summaries = sums;
            return next;
        });
        return summaries;
    }, []);

    const addLogMessage = useCallback((msg: Omit<LogMessage, 'id' | 'timestamp'>) => {
        setStateInternal((prev) => {
            if (!prev) return prev;
            const newMsg: LogMessage = {
                ...msg,
                id: `msg-${++messageIdCounter}`,
                timestamp: Date.now(),
            };
            return {
                ...prev,
                log: {
                    messages: [...prev.log.messages, newMsg],
                },
            };
        });
    }, []);

    return (
        <GameContext.Provider value={{ state, setState, updateWithPatch, addLogMessage }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame(): GameContextValue {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error('useGame must be used within GameProvider');
    return ctx;
}
