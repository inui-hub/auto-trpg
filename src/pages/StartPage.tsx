/**
 * Start Page — session entry point.
 * Theme/mood input + "はじめる" button.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';

const THEME_PRESETS = [
    'ホラー',
    'ミステリー',
    '冒険',
    '現代日本',
    '異世界',
    'コミカル',
    '重い',
    '軽い',
];

export default function StartPage() {
    const [theme, setTheme] = useState('');
    const navigate = useNavigate();
    const { setState } = useGame();

    const handleStart = () => {
        // Reset to blank state; Character page will fill in PC details.
        setState({
            session: {
                sessionId: crypto.randomUUID(),
                sceneIndex: 0,
                phase: 'introduction',
                summary: '',
                outline: '',
                guidance: '',
                theme,
            },
            pc: {
                profile: { name: '', occupation: '', age: '', gender: '', traits: '' },
                abilities: { STR: 0, CON: 0, POW: 0, DEX: 0, APP: 0, SIZ: 0, INT: 0, EDU: 0 },
                derived: { SAN: 0, luck: 0, idea: 0, knowledge: 0, HP: 0, MP: 0 },
                skills: {},
                resources: { currentSAN: 0, maxSAN: 0, currentHP: 0, maxHP: 0, currentMP: 0, maxMP: 0 },
                inventory: [],
            },
            world: { objective: '', flags: [], npcs: [] },
            log: { messages: [] },
        });
        navigate('/character');
    };

    const addPreset = (preset: string) => {
        setTheme((prev) => {
            if (prev && !prev.endsWith('、') && !prev.endsWith(' ')) return prev + '、' + preset;
            return prev + preset;
        });
    };

    const overLimit = theme.length > 200;

    return (
        <div className="page start-page">
            <div className="start-container">
                <h1 className="start-title">LLM GM ソロTRPG</h1>
                <p className="start-subtitle">
                    LLMがGMとなり、あなただけの物語を紡ぎます。
                    <br />
                    約1時間で完結するソロTRPG体験。
                </p>

                <div className="start-theme">
                    <label htmlFor="theme-input">テーマ・雰囲気（任意）</label>
                    <textarea
                        id="theme-input"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        placeholder="例：静かな田舎のミステリー。怖すぎない"
                        rows={3}
                        maxLength={250}
                    />
                    <div className="theme-meta">
                        <span className={overLimit ? 'over-limit' : ''}>{theme.length} / 200</span>
                    </div>

                    <div className="preset-chips">
                        {THEME_PRESETS.map((p) => (
                            <button key={p} type="button" className="chip" onClick={() => addPreset(p)}>
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    className="btn-primary btn-start"
                    onClick={handleStart}
                >
                    はじめる
                </button>
            </div>
        </div>
    );
}
