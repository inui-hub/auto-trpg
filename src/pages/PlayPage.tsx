/**
 * Play Page — Main game loop with chat, choices, dice checks, and status panel.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { generateInitialScenario, advanceTurn } from '../services/stubLlm';
import { performCheck } from '../services/mechanics';
import { SUCCESS_LEVEL_LABELS, DIFFICULTY_LABELS } from '../types/mechanics';
import type { CheckRequest, CheckResult, LLMResponse } from '../types/game';

export default function PlayPage() {
    const navigate = useNavigate();
    const { state, setState, updateWithPatch, addLogMessage } = useGame();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [pendingCheck, setPendingCheck] = useState<CheckRequest | null>(null);
    const [lastCheckResult, setLastCheckResult] = useState<CheckResult | null>(null);
    const [choices, setChoices] = useState<string[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    // Guard: no state → back to start
    useEffect(() => {
        if (!state || !state.pc.profile.name) {
            navigate('/');
        }
    }, [state, navigate]);

    // Initialize scenario on first render
    useEffect(() => {
        if (!state || initialized.current) return;
        if (state.log.messages.length > 0) return; // Already has messages
        initialized.current = true;

        const scenario = generateInitialScenario(state.pc.profile.name, state.session.theme);

        // Update state with scenario data
        setState({
            ...state,
            session: {
                ...state.session,
                outline: scenario.outline,
                guidance: scenario.guidance,
            },
            world: {
                ...state.world,
                objective: scenario.objective,
                flags: scenario.initialFlags,
            },
            pc: {
                ...state.pc,
                inventory: [...state.pc.inventory, ...scenario.initialInventory],
            },
        });

        addLogMessage({ type: 'gm', text: scenario.introductionText });
    }, [state, setState, addLogMessage]);

    // Auto-scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [state?.log.messages.length, pendingCheck, lastCheckResult]);

    // Process LLM response
    const processResponse = useCallback((response: LLMResponse) => {
        // GM text
        addLogMessage({ type: 'gm', text: response.playerFacingText });

        // Choices
        setChoices(response.choices || []);

        // State patch
        if (response.statePatch) {
            const summaries = updateWithPatch(response.statePatch);
            if (summaries.length > 0) {
                addLogMessage({
                    type: 'system',
                    text: '📋 状態更新: ' + summaries.join(' / '),
                });
            }
        }

        // Check request
        if (response.checkRequest) {
            setPendingCheck(response.checkRequest);
        }

        // End signal
        if (response.endSignal) {
            addLogMessage({
                type: 'system',
                text: `🏁 セッション終了: ${response.endSignal.reason}`,
            });
            // Update phase to ending and navigate to result
            setState((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    session: { ...prev.session, phase: 'ending' },
                };
            });
            setTimeout(() => navigate('/result'), 2000);
        }
    }, [addLogMessage, updateWithPatch, navigate, setState]);

    // Send message
    const handleSend = useCallback((text: string) => {
        if (!state || !text.trim() || loading) return;

        addLogMessage({ type: 'player', text: text.trim() });
        setInput('');
        setChoices([]);
        setLoading(true);

        // Simulate async LLM call
        setTimeout(() => {
            const response = advanceTurn(state, text.trim());
            processResponse(response);
            setLoading(false);
        }, 800);
    }, [state, loading, addLogMessage, processResponse]);

    // Handle choice click
    const handleChoice = (choice: string) => {
        handleSend(choice);
    };

    // Handle dice roll
    const handleRoll = () => {
        if (!pendingCheck || !state) return;

        const skillValue = state.pc.skills[pendingCheck.skill] ?? 0;
        const result = performCheck(pendingCheck.skill, skillValue, pendingCheck.difficulty);
        setLastCheckResult(result);
        setPendingCheck(null);

        // Log check result
        addLogMessage({
            type: 'system',
            text: `🎲 判定: ${result.skill}（目標値 ${result.targetValue}）→ 出目 ${result.roll} → ${SUCCESS_LEVEL_LABELS[result.successLevel]}`,
        });

        // Send result to LLM (stub)
        setLoading(true);
        setTimeout(() => {
            const response = advanceTurn(state, `[判定結果] ${result.skill}: ${SUCCESS_LEVEL_LABELS[result.successLevel]}`);
            processResponse(response);
            setLoading(false);
            setLastCheckResult(null);
        }, 800);
    };

    // Keyboard handling
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(input);
        }
    };

    if (!state) return null;

    const messages = state.log.messages;

    return (
        <div className="page play-page">
            {/* Status panel */}
            <aside className="status-panel">
                <h3>ステータス</h3>

                <div className="status-section">
                    <h4>目的</h4>
                    <p className="objective-text">{state.world.objective || '—'}</p>
                </div>

                <div className="status-section">
                    <h4>リソース</h4>
                    <div className="resource-bars">
                        <ResourceBar label="SAN" current={state.pc.resources.currentSAN} max={state.pc.resources.maxSAN} color="var(--color-san)" />
                        <ResourceBar label="HP" current={state.pc.resources.currentHP} max={state.pc.resources.maxHP} color="var(--color-hp)" />
                        <ResourceBar label="MP" current={state.pc.resources.currentMP} max={state.pc.resources.maxMP} color="var(--color-mp)" />
                    </div>
                </div>

                <div className="status-section">
                    <h4>所持品</h4>
                    <ul className="inventory-list">
                        {state.pc.inventory.length === 0 && <li className="empty">なし</li>}
                        {state.pc.inventory.map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>
                </div>

                <div className="status-section">
                    <h4>重要フラグ</h4>
                    <div className="flags-list">
                        {state.world.flags.length === 0 && <span className="empty">なし</span>}
                        {state.world.flags.map((flag, i) => (
                            <span key={i} className="flag-tag">{flag}</span>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Chat area */}
            <main className="chat-area">
                <div className="chat-messages">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`chat-msg chat-msg-${msg.type}`}>
                            <span className="msg-label">
                                {msg.type === 'gm' ? 'GM' : msg.type === 'player' ? 'あなた' : 'System'}
                            </span>
                            <div className="msg-text">{msg.text}</div>
                        </div>
                    ))}

                    {/* Pending check UI */}
                    {pendingCheck && (
                        <div className="check-panel">
                            <h4>⚔️ 判定要求</h4>
                            <p><strong>技能:</strong> {pendingCheck.skill}</p>
                            <p><strong>難易度:</strong> {DIFFICULTY_LABELS[pendingCheck.difficulty]}</p>
                            <p><strong>目的:</strong> {pendingCheck.purpose}</p>
                            <p><strong>目標値:</strong> {state.pc.skills[pendingCheck.skill] ?? '?'}</p>
                            <button className="btn-primary btn-roll" onClick={handleRoll}>
                                🎲 ロールする (d100)
                            </button>
                        </div>
                    )}

                    {/* Check result display */}
                    {lastCheckResult && (
                        <div className="check-result">
                            <p>出目: <strong>{lastCheckResult.roll}</strong> / 目標値: {lastCheckResult.targetValue}</p>
                            <p className={`result-level result-${lastCheckResult.successLevel}`}>
                                {SUCCESS_LEVEL_LABELS[lastCheckResult.successLevel]}
                            </p>
                        </div>
                    )}

                    {/* Loading indicator */}
                    {loading && (
                        <div className="chat-msg chat-msg-system loading-msg">
                            <span className="loading-dots">GMが考えています</span>
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                {/* Choices */}
                {choices.length > 0 && !loading && !pendingCheck && (
                    <div className="choices-bar">
                        {choices.map((c, i) => (
                            <button key={i} className="btn-choice" onClick={() => handleChoice(c)}>
                                {c}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div className="chat-input-bar">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="行動を入力... (Enter で送信、Shift+Enter で改行)"
                        disabled={loading || !!pendingCheck}
                        rows={2}
                    />
                    <button
                        className="btn-primary btn-send"
                        onClick={() => handleSend(input)}
                        disabled={loading || !input.trim() || !!pendingCheck}
                    >
                        送信
                    </button>
                </div>
            </main>
        </div>
    );
}

// ── Resource bar component ──
function ResourceBar({ label, current, max, color }: { label: string; current: number; max: number; color: string }) {
    const pct = max > 0 ? Math.round((current / max) * 100) : 0;
    return (
        <div className="resource-bar">
            <span className="resource-label">{label}</span>
            <div className="resource-track">
                <div className="resource-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
            <span className="resource-value">{current}/{max}</span>
        </div>
    );
}
