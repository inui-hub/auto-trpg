/**
 * Stub LLM service for Phase A (no real backend).
 * Returns scripted responses to exercise all LLM output types:
 * choices, check_request, state_patch, end_signal
 */

import type { GameState, LLMResponse, InitialScenarioResponse, SessionResult } from '../types/game';

/** Generate initial scenario (stub) */
export function generateInitialScenario(
    _pcName: string,
    theme: string
): InitialScenarioResponse {
    const themeText = theme || '不思議な洋館を舞台にしたミステリー';

    return {
        outline: `[STUB OUTLINE] テーマ「${themeText}」に基づくシナリオ。全5シーン構成。`,
        guidance: `真相：洋館の主人が隠していた秘密。障害：封じられた部屋と謎の使用人。鍵：古い日記。結末条件：真相到達 or 時間切れ。`,
        introductionText:
            `あなたは古びた洋館の前に立っている。\n\n` +
            `霧の立ち込める夕暮れ、一通の招待状に導かれてこの場所にたどり着いた。` +
            `重厚な扉は半開きになっており、中からかすかに蝋燭の光が漏れている。\n\n` +
            `洋館の中からは、微かにピアノの旋律が聞こえてくる……。`,
        objective: '洋館に入り、招待状の差出人を見つける',
        initialFlags: [],
        initialInventory: ['招待状', '懐中電灯', 'メモ帳'],
    };
}

/** Turn counter tracked by scene_index for stub behavior */
export function advanceTurn(
    state: GameState,
    playerInput: string
): LLMResponse {
    const turn = state.log.messages.filter((m) => m.type === 'player').length;

    // Turn 1: choices
    if (turn <= 1) {
        return {
            playerFacingText:
                `あなたは玄関ホールに足を踏み入れた。` +
                `天井からぶら下がるシャンデリアは半分の蝋燭しか灯っていない。\n\n` +
                `正面に大きな階段、左手に書斎らしき扉、右手にはダイニングへ続く廊下が見える。`,
            choices: [
                '階段を上る',
                '書斎の扉を開ける',
                'ダイニングへ向かう',
            ],
        };
    }

    // Turn 2: check_request (skill check)
    if (turn === 2) {
        return {
            playerFacingText:
                `書斎に入ると、埃っぽい空気が漂っている。\n\n` +
                `机の上に古い日記帳が置かれている。しかし、文字が褪せていて読みづらい。` +
                `注意深く観察すれば、何か重要な情報が見つかるかもしれない。`,
            checkRequest: {
                skill: '目星',
                difficulty: 'normal',
                purpose: '日記帳の中の重要な記述を見つける',
                failureHint: '情報を見落とし、時間を浪費する可能性がある',
            },
        };
    }

    // Turn 3: state_patch (after check result or normal turn)
    if (turn === 3) {
        return {
            playerFacingText:
                `日記帳を調べた結果、この洋館の主人が「地下室に大切なものを隠した」ことがわかった。\n\n` +
                `しかし同時に、廊下の奥から不穏な物音が聞こえてきた。` +
                `あなたは思わず身構える——背後に何かがいる気配がする。`,
            statePatch: {
                flagsAdd: ['地下室の存在を知った'],
                objective: '地下室を見つけ、隠されたものを確認する',
            },
            choices: [
                '物音の方を確認する',
                '地下室への入口を探す',
            ],
        };
    }

    // Turn 4: another check
    if (turn === 4) {
        return {
            playerFacingText:
                `地下への階段を見つけた。しかし扉には古びた鍵がかかっている。\n\n` +
                `鍵穴は単純な構造に見える。道具があれば開けられるかもしれない。`,
            checkRequest: {
                skill: '鍵開け',
                difficulty: 'hard',
                purpose: '地下室の扉を開ける',
                failureHint: '鍵を壊してしまうかもしれない',
            },
        };
    }

    // Turn 5: state_patch with resource damage + items
    if (turn === 5) {
        return {
            playerFacingText:
                `地下室に入ると、そこには古い箱が一つ置かれていた。\n\n` +
                `箱を開けた瞬間、中から異様な光が溢れ出し、` +
                `あなたは一瞬意識が遠のく。正気を取り戻すと、手の中に奇妙な石が握られていた。\n\n` +
                `この石が招待状の差出人が隠していたものに違いない。`,
            statePatch: {
                resources: {
                    currentSAN: Math.max(0, (state.pc.resources.currentSAN || 50) - 3),
                },
                inventoryAdd: ['奇妙な光る石'],
                flagsAdd: ['箱を開けた', '光る石を入手'],
                objective: '光る石の正体を突き止め、洋館を脱出する',
            },
        };
    }

    // Turn 6: another choices
    if (turn === 6) {
        return {
            playerFacingText:
                `地下室から戻ると、洋館の雰囲気が一変していた。\n\n` +
                `照明が消え、どこからか冷たい風が吹き込んでいる。` +
                `玄関の扉は——閉ざされている。\n\n` +
                `二階から微かな声が聞こえる。「……こちらへ……」`,
            choices: [
                '声の方へ向かう（二階へ）',
                '玄関の扉をこじ開けようとする',
                '光る石を掲げてみる',
            ],
        };
    }

    // Turn 7+: end_signal
    if (turn >= 7) {
        return {
            playerFacingText:
                `光る石を掲げると、洋館全体が輝きに包まれた。\n\n` +
                `壁に染み込んでいた影のような存在が、光に焼かれるように消えていく。` +
                `やがて光が収まると、洋館は静かな佇まいを取り戻していた。\n\n` +
                `玄関の扉が静かに開く。外には朝日が差し込んでいる。\n\n` +
                `あなたは招待状の差出人——この洋館に囚われていた霊の願いを叶えた。` +
                `彼は安らかに旅立ち、洋館はただの古い建物に戻った。`,
            endSignal: {
                type: 'success',
                reason: '洋館の謎を解き、囚われた霊を解放した',
            },
            statePatch: {
                flagsAdd: ['霊を解放した'],
            },
        };
    }

    // Default fallback
    return {
        playerFacingText:
            `${playerInput}——あなたの行動に対して、洋館は沈黙で応えた。\n\n` +
            `何かが変わった気がするが、具体的には分からない。先に進もう。`,
        choices: ['周囲を調べる', '先に進む'],
    };
}

/**
 * Generate session result (stub)
 */
export function generateResult(state: GameState): SessionResult {
    const endType = state.session.phase === 'ending' ? 'success' : 'fail';

    return {
        endType,
        summary:
            endType === 'success'
                ? `あなたは洋館の謎を解き明かし、囚われた霊を解放することに成功した。古い洋館は静けさを取り戻し、あなたは朝日の中を帰路についた。`
                : `あなたは洋館から脱出したが、すべての謎を解くことはできなかった。光る石は手元に残り、いつかまた戻る日が来るかもしれない。`,
        gains: state.world.flags.filter((f) => f.includes('入手') || f.includes('解放')),
        losses: ['正気度の一部'],
        finalResources: { ...state.pc.resources },
        finalFlags: [...state.world.flags],
    };
}
