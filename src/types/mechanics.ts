/**
 * CoC6-style mechanics types and constants
 * Based on mechanics-spec.md
 */

// ── Ability types ──

export type AbilityName = 'STR' | 'CON' | 'POW' | 'DEX' | 'APP' | 'SIZ' | 'INT' | 'EDU';

export interface Abilities {
    STR: number;
    CON: number;
    POW: number;
    DEX: number;
    APP: number;
    SIZ: number;
    INT: number;
    EDU: number;
}

/** Dice formula for each ability */
export const ABILITY_DICE: Record<AbilityName, { count: number; sides: number; modifier: number }> = {
    STR: { count: 3, sides: 6, modifier: 0 },
    CON: { count: 3, sides: 6, modifier: 0 },
    POW: { count: 3, sides: 6, modifier: 0 },
    DEX: { count: 3, sides: 6, modifier: 0 },
    APP: { count: 3, sides: 6, modifier: 0 },
    SIZ: { count: 2, sides: 6, modifier: 6 },
    INT: { count: 2, sides: 6, modifier: 6 },
    EDU: { count: 3, sides: 6, modifier: 3 },
};

export const ABILITY_LABELS: Record<AbilityName, string> = {
    STR: '筋力',
    CON: '体力',
    POW: '精神力',
    DEX: '敏捷性',
    APP: '外見',
    SIZ: '体格',
    INT: '知性',
    EDU: '教育',
};

// ── Derived values ──

export interface DerivedValues {
    SAN: number;    // POW × 5
    luck: number;   // POW × 5
    idea: number;   // INT × 5
    knowledge: number; // EDU × 5
    HP: number;     // (CON + SIZ) / 2 (floor)
    MP: number;     // POW × 1
}

export function calculateDerived(abilities: Abilities): DerivedValues {
    return {
        SAN: abilities.POW * 5,
        luck: abilities.POW * 5,
        idea: abilities.INT * 5,
        knowledge: abilities.EDU * 5,
        HP: Math.floor((abilities.CON + abilities.SIZ) / 2),
        MP: abilities.POW,
    };
}

// ── Skill types ──

export type SkillCategory = 'exploration' | 'social' | 'physical' | 'technical' | 'combat';

export interface SkillDefinition {
    name: string;
    baseValue: number;
    category: SkillCategory;
    description: string;
}

export const SKILL_LIST: SkillDefinition[] = [
    // 探索・知覚
    { name: '目星', baseValue: 25, category: 'exploration', description: '隠された手掛かり、違和感の発見' },
    { name: '聞き耳', baseValue: 25, category: 'exploration', description: '物音、会話、接近の察知' },
    { name: '図書館', baseValue: 20, category: 'exploration', description: '資料調査、記録・文献からの情報' },
    { name: '追跡', baseValue: 10, category: 'exploration', description: '足跡、痕跡、対象の追尾' },
    { name: 'ナビゲート', baseValue: 10, category: 'exploration', description: '道順、地理、迷わず移動' },

    // 対人・交渉
    { name: '説得', baseValue: 15, category: 'social', description: '論理的に納得させる' },
    { name: '言いくるめ', baseValue: 10, category: 'social', description: 'その場しのぎ、口先、軽い嘘' },
    { name: '威圧', baseValue: 15, category: 'social', description: '脅し、圧、強い態度' },
    { name: '信用', baseValue: 15, category: 'social', description: '身分・権威・誠実さで通す' },
    { name: '心理学', baseValue: 10, category: 'social', description: '嘘や動揺の見抜き、相手の意図の推測' },

    // 身体・行動
    { name: '隠れる', baseValue: 10, category: 'physical', description: '身を隠す、見つからないようにする' },
    { name: '忍び歩き', baseValue: 10, category: 'physical', description: '音を立てずに近づく/離れる' },
    { name: '登攀', baseValue: 20, category: 'physical', description: '壁・崖・高所の移動' },
    { name: '回避', baseValue: 25, category: 'physical', description: '危険の回避、攻撃の回避' },
    { name: '応急手当', baseValue: 30, category: 'physical', description: '応急処置、止血、簡易回復' },

    // 技術・工作
    { name: '鍵開け', baseValue: 10, category: 'technical', description: '鍵・簡易な施錠の突破' },
    { name: '機械修理', baseValue: 10, category: 'technical', description: '装置の修理、簡易なメンテ' },
    { name: '電気修理', baseValue: 10, category: 'technical', description: '配線、電源、電子機器の復旧' },
    { name: '隠す', baseValue: 10, category: 'technical', description: '物品の隠匿、証拠隠し' },

    // 対立（危機・戦闘相当）
    { name: '近接戦闘', baseValue: 25, category: 'combat', description: '殴る、組み付く、簡易武器' },
    { name: '射撃', baseValue: 20, category: 'combat', description: '拳銃・弓・投擲など遠距離' },
    { name: '投擲', baseValue: 20, category: 'combat', description: '石、ナイフ、即席の投げ' },
];

export const SKILL_MAX = 80;

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
    exploration: '探索・知覚',
    social: '対人・交渉',
    physical: '身体・行動',
    technical: '技術・工作',
    combat: '対立',
};

// ── Dice & Judgment ──

export type DifficultyLevel = 'normal' | 'hard' | 'extreme';

export type SuccessLevel = 'critical' | 'extreme' | 'hard' | 'regular' | 'failure' | 'fumble';

export const SUCCESS_LEVEL_LABELS: Record<SuccessLevel, string> = {
    critical: 'クリティカル',
    extreme: 'イクストリーム成功',
    hard: 'ハード成功',
    regular: 'レギュラー成功',
    failure: '失敗',
    fumble: 'ファンブル',
};

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
    normal: '標準',
    hard: '難しい',
    extreme: '非常に難しい',
};
