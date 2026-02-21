import type { GameState, LLMResponse, InitialScenarioResponse } from './game';

export interface ChatRequest {
    state: GameState;
    input?: string;
    isInitial: boolean;
    theme?: string;
    pcName?: string;
}

export interface ChatResponse {
    llmResponse?: LLMResponse;
    initialScenario?: InitialScenarioResponse;
    error?: string;
}
