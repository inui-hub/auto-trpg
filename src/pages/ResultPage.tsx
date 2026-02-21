/**
 * Result Page — post-session summary.
 */

import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { generateResult } from '../services/api';

export default function ResultPage() {
    const navigate = useNavigate();
    const { state } = useGame();

    useEffect(() => {
        if (!state) navigate('/');
    }, [state, navigate]);

    const result = useMemo(() => {
        if (!state) return null;
        return generateResult(state);
    }, [state]);

    if (!state || !result) return null;

    const endTypeLabel: Record<string, string> = {
        success: '🏆 成功',
        fail: '💀 失敗',
        time_up: '⏰ 時間切れ',
    };

    return (
        <div className="page result-page">
            <div className="result-container">
                <h1 className="result-title">{endTypeLabel[result.endType] || '終了'}</h1>

                <section className="result-section">
                    <h2>セッション要約</h2>
                    <p>{result.summary}</p>
                </section>

                {result.gains.length > 0 && (
                    <section className="result-section">
                        <h2>獲得</h2>
                        <ul>
                            {result.gains.map((g: string, i: number) => (
                                <li key={i}>✅ {g}</li>
                            ))}
                        </ul>
                    </section>
                )}

                {result.losses.length > 0 && (
                    <section className="result-section">
                        <h2>喪失</h2>
                        <ul>
                            {result.losses.map((l: string, i: number) => (
                                <li key={i}>❌ {l}</li>
                            ))}
                        </ul>
                    </section>
                )}

                <section className="result-section">
                    <h2>最終状態</h2>
                    <div className="final-resources">
                        <span>SAN: {result.finalResources.currentSAN}/{result.finalResources.maxSAN}</span>
                        <span>HP: {result.finalResources.currentHP}/{result.finalResources.maxHP}</span>
                        <span>MP: {result.finalResources.currentMP}/{result.finalResources.maxMP}</span>
                    </div>
                    {result.finalFlags.length > 0 && (
                        <div className="final-flags">
                            <h3>重要フラグ</h3>
                            <div className="flags-list">
                                {result.finalFlags.map((f: string, i: number) => (
                                    <span key={i} className="flag-tag">{f}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                <button className="btn-primary btn-restart" onClick={() => navigate('/')}>
                    🔄 もう一度遊ぶ
                </button>
            </div>
        </div>
    );
}
