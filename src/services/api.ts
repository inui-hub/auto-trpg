/**
 * API service for communicating with the backend.
 * Replaces the local stubLlm.ts from Phase A.
 */

import type { GameState, LLMResponse, InitialScenarioResponse } from '../types/game';
import type { ChatRequest, ChatResponse } from '../types/api';

/**
 * Call the backend API to generate the initial scenario.
 */
export async function generateInitialScenario(
    pcName: string,
    theme: string,
    state: GameState
): Promise<InitialScenarioResponse> {
    const reqBody: ChatRequest = {
        state,
        isInitial: true,
        theme,
        pcName,
    };

    const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
    });

    if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const data: ChatResponse = await res.json();
    if (data.error) {
        throw new Error(`API error: ${data.error}`);
    }

    if (!data.initialScenario) {
        throw new Error('Missing initialScenario in response');
    }

    return data.initialScenario;
}

/**
 * Call the backend API to advance the turn.
 */
export async function advanceTurn(
    state: GameState,
    playerInput: string
): Promise<LLMResponse> {
    const reqBody: ChatRequest = {
        state,
        input: playerInput,
        isInitial: false,
    };

    const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
    });

    if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const data: ChatResponse = await res.json();
    if (data.error) {
        throw new Error(`API error: ${data.error}`);
    }

    if (!data.llmResponse) {
        throw new Error('Missing llmResponse in response');
    }

    // The backend might send back an object that misses some optional fields,
    // making sure we return a full LLMResponse object
    return data.llmResponse;
}

/**
 * Generate session result (stub, local for MVP)
 */
export function generateResult(state: GameState) {
    const endType = state.session.phase === 'ending' ? 'success' : 'fail';

    return {
        endType,
        summary:
            endType === 'success'
                ? `あなたは洋館の謎を解き明かし、囚われた霊を解放することに成功した。古い洋館は静けさを取り戻し、あなたは朝日の中を帰路についた。`
                : `あなたは洋館から脱出したが、すべての謎を解くことはできなかった。光る石は手元に残り、いつかまた戻る日が来るかもしれない。`,
        gains: state.world.flags.filter((f: string) => f.includes('入手') || f.includes('解放')),
        losses: ['正気度の一部'],
        finalResources: { ...state.pc.resources },
        finalFlags: [...state.world.flags],
    };
}
