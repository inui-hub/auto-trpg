/**
 * Character Page — CoC6-style character creation.
 * Ability rolls, derived values, skill allocation.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import {
    ABILITY_DICE,
    ABILITY_LABELS,
    SKILL_LIST,
    SKILL_MAX,
    SKILL_CATEGORY_LABELS,
    calculateDerived,
    type Abilities,
    type AbilityName,
    type SkillCategory,
} from '../types/mechanics';
import { rollDice } from '../services/mechanics';

export default function CharacterPage() {
    const navigate = useNavigate();
    const { state, setState } = useGame();

    // ── Profile ──
    const [name, setName] = useState('');
    const [occupation, setOccupation] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [traits, setTraits] = useState('');

    // ── Abilities ──
    const [abilities, setAbilities] = useState<Abilities | null>(null);

    // ── Skills allocation ──
    const [skillAlloc, setSkillAlloc] = useState<Record<string, number>>(() => {
        const map: Record<string, number> = {};
        SKILL_LIST.forEach((s) => (map[s.name] = 0));
        return map;
    });

    // Roll all abilities
    const rollAbilities = useCallback(() => {
        const rolled: Partial<Abilities> = {};
        for (const [key, dice] of Object.entries(ABILITY_DICE)) {
            rolled[key as AbilityName] = rollDice(dice.count, dice.sides, dice.modifier);
        }
        setAbilities(rolled as Abilities);
        // Reset skills when re-rolling
        const map: Record<string, number> = {};
        SKILL_LIST.forEach((s) => (map[s.name] = 0));
        setSkillAlloc(map);
    }, []);

    // Derived values
    const derived = useMemo(() => (abilities ? calculateDerived(abilities) : null), [abilities]);

    // Skill points
    const vocationalPoints = abilities ? abilities.EDU * 20 : 0;
    const hobbyPoints = abilities ? abilities.INT * 10 : 0;
    const totalPoints = vocationalPoints + hobbyPoints;
    const usedPoints = Object.values(skillAlloc).reduce((sum, v) => sum + v, 0);
    const remainingPoints = totalPoints - usedPoints;

    // Skill change handler
    const handleSkillChange = (skillName: string, delta: number) => {
        setSkillAlloc((prev) => {
            const current = prev[skillName] || 0;
            const base = SKILL_LIST.find((s) => s.name === skillName)?.baseValue ?? 0;
            const newAlloc = Math.max(0, current + delta);
            const total = base + newAlloc;

            // Cap at SKILL_MAX
            if (total > SKILL_MAX) return prev;

            // Don't exceed remaining
            if (delta > 0 && remainingPoints <= 0) return prev;

            return { ...prev, [skillName]: newAlloc };
        });
    };

    // Validation
    const canStart = name.trim() !== '' && abilities !== null;

    // Navigate away guard
    useEffect(() => {
        if (!state) navigate('/');
    }, [state, navigate]);

    // Confirm and start
    const handleConfirm = () => {
        if (!state || !abilities || !derived) return;

        const finalSkills: Record<string, number> = {};
        SKILL_LIST.forEach((s) => {
            finalSkills[s.name] = s.baseValue + (skillAlloc[s.name] || 0);
        });

        const updatedState = {
            ...state,
            pc: {
                ...state.pc,
                profile: { name, occupation, age, gender, traits },
                abilities,
                derived,
                skills: finalSkills,
                resources: {
                    currentSAN: derived.SAN,
                    maxSAN: 99,
                    currentHP: derived.HP,
                    maxHP: derived.HP,
                    currentMP: derived.MP,
                    maxMP: derived.MP,
                },
            },
        };

        setState(updatedState);
        navigate('/play');
    };

    // Group skills by category
    const skillsByCategory = useMemo(() => {
        const map = new Map<SkillCategory, typeof SKILL_LIST>();
        SKILL_LIST.forEach((s) => {
            if (!map.has(s.category)) map.set(s.category, []);
            map.get(s.category)!.push(s);
        });
        return map;
    }, []);

    return (
        <div className="page character-page">
            <h1>キャラクター作成</h1>

            {/* ── Profile ── */}
            <section className="char-section">
                <h2>プロフィール</h2>
                <div className="form-grid">
                    <label>
                        名前 <span className="required">*</span>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="キャラクター名" />
                    </label>
                    <label>
                        職業
                        <input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="例：探偵、学生" />
                    </label>
                    <label>
                        年齢
                        <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="例：28" />
                    </label>
                    <label>
                        性別
                        <input value={gender} onChange={(e) => setGender(e.target.value)} placeholder="例：男性" />
                    </label>
                    <label className="full-width">
                        特徴
                        <input value={traits} onChange={(e) => setTraits(e.target.value)} placeholder="長所/短所、背景など" />
                    </label>
                </div>
            </section>

            {/* ── Abilities ── */}
            <section className="char-section">
                <h2>能力値</h2>
                <button className="btn-secondary" onClick={rollAbilities}>
                    🎲 能力値を振る
                </button>
                {abilities && (
                    <div className="abilities-grid">
                        {(Object.keys(ABILITY_LABELS) as AbilityName[]).map((key) => (
                            <div key={key} className="ability-card">
                                <span className="ability-name">{ABILITY_LABELS[key]}</span>
                                <span className="ability-value">{abilities[key]}</span>
                                <span className="ability-key">{key}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Derived ── */}
            {derived && (
                <section className="char-section">
                    <h2>派生値</h2>
                    <div className="derived-grid">
                        <div className="derived-item"><span>SAN</span><span>{derived.SAN}</span></div>
                        <div className="derived-item"><span>HP</span><span>{derived.HP}</span></div>
                        <div className="derived-item"><span>MP</span><span>{derived.MP}</span></div>
                        <div className="derived-item"><span>幸運</span><span>{derived.luck}</span></div>
                        <div className="derived-item"><span>アイデア</span><span>{derived.idea}</span></div>
                        <div className="derived-item"><span>知識</span><span>{derived.knowledge}</span></div>
                    </div>
                </section>
            )}

            {/* ── Skills ── */}
            {abilities && (
                <section className="char-section">
                    <h2>技能割り振り</h2>
                    <div className="skill-points-summary">
                        <span>職業ポイント: {vocationalPoints}（EDU×20）</span>
                        <span>趣味ポイント: {hobbyPoints}（INT×10）</span>
                        <span className={remainingPoints < 0 ? 'over-limit' : ''}>
                            残り: {remainingPoints} / {totalPoints}
                        </span>
                    </div>

                    {Array.from(skillsByCategory.entries()).map(([cat, skills]) => (
                        <div key={cat} className="skill-category">
                            <h3>{SKILL_CATEGORY_LABELS[cat]}</h3>
                            <div className="skill-list">
                                {skills.map((skill) => {
                                    const alloc = skillAlloc[skill.name] || 0;
                                    const total = skill.baseValue + alloc;
                                    return (
                                        <div key={skill.name} className="skill-row">
                                            <span className="skill-name" title={skill.description}>
                                                {skill.name}
                                            </span>
                                            <span className="skill-base">基礎: {skill.baseValue}%</span>
                                            <div className="skill-controls">
                                                <button
                                                    className="btn-small"
                                                    onClick={() => handleSkillChange(skill.name, -5)}
                                                    disabled={alloc <= 0}
                                                >−</button>
                                                <span className="skill-alloc">+{alloc}</span>
                                                <button
                                                    className="btn-small"
                                                    onClick={() => handleSkillChange(skill.name, 5)}
                                                    disabled={remainingPoints <= 0 || total >= SKILL_MAX}
                                                >+</button>
                                            </div>
                                            <span className="skill-total">{total}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {/* ── Confirm ── */}
            <div className="char-actions">
                {!canStart && (
                    <p className="validation-msg">
                        {!name.trim() && '名前を入力してください。'}
                        {!abilities && ' 能力値を振ってください。'}
                    </p>
                )}
                <button className="btn-primary" onClick={handleConfirm} disabled={!canStart}>
                    確定して開始
                </button>
            </div>
        </div>
    );
}
