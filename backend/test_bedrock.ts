import { advanceTurnBedrock } from './src/services/bedrockLlm';

async function test() {
    const state = {
        session: { session_id: '1', scene_index: 0, phase: 'introduction', summary: '' },
        pc: {
            profile: { name: 'テスト主', age: 20, gender: '不明', occupation: '探偵', background: '' },
            abilities: { STR: 50, CON: 50, POW: 50, DEX: 50, APP: 50, SIZ: 50, INT: 50, EDU: 50, LUCK: 50 },
            derived: { SAN: 50, HP: 10, MP: 10, DB: '0', Build: 0, Move: 8 },
            skills: [],
            resources: { currentSAN: 50, currentHP: 10, currentMP: 10 },
            inventory: ['招待状']
        },
        world: { objective: '館に入る', flags: [], npcs: [] },
        log: { messages: [{ type: 'gm', text: 'ようこそ' }] }
    };

    try {
        const res = await advanceTurnBedrock(state as any, '階段を上る');
        console.log(JSON.stringify(res, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
