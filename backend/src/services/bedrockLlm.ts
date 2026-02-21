import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import type { GameState, InitialScenarioResponse, LLMResponse } from '../types/game';

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'ap-northeast-1' });
const MODEL_ID = 'anthropic.claude-3-haiku-20240307-v1:0';

async function invokeClaude(systemPrompt: string, userPrompt: string, maxTokens: number = 2000): Promise<string> {
    const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: maxTokens,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
            {
                role: "user",
                content: [{ type: "text", text: userPrompt }]
            }
        ]
    };

    const command = new InvokeModelCommand({
        modelId: MODEL_ID,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload)
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.content[0].text;
}

function extractJson(text: string): any {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found in response");
    return JSON.parse(match[0]);
}

/** Generate initial scenario via Bedrock */
export async function generateInitialScenarioBedrock(
    pcName: string,
    theme: string
): Promise<InitialScenarioResponse> {
    const systemPrompt = `あなたはTRPGのゲームマスターです。クトゥルフ神話TRPG風のシステムで一人用シナリオを構築します。
必ず以下のJSONスキーマに沿って、有効なJSONオブジェクトのみを出力してください。Markdownのコードブロックは使用しないでください。
{
  "outline": "シナリオの全体像（非公開）",
  "guidance": "シナリオの要点・解決条件（非公開フラグ管理用）",
  "introductionText": "プレイヤーに表示する導入の描写文章",
  "objective": "プレイヤーの最初の目的（短い文字列）",
  "initialFlags": ["初期状態で持っているフラグの配列"],
  "initialInventory": ["初期所持品の配列"]
}`;

    const userPrompt = `主人公の名前は「${pcName}」です。
シナリオのテーマ: ${theme || '不思議な洋館を舞台にしたミステリー'}
このテーマに基づく、少し不穏で探索要素のあるショートシナリオの導入を作成してください。`;

    let lastError = null;
    for (let i = 0; i < 3; i++) {
        try {
            const responseText = await invokeClaude(systemPrompt, userPrompt);
            return extractJson(responseText) as InitialScenarioResponse;
        } catch (e) {
            lastError = e;
            console.warn(`JSON parse failed on attempt ${i + 1}, retrying...`, e);
        }
    }
    throw new Error(`Failed to generate initial scenario after 3 attempts: ${lastError}`);
}

/** Advance turn via Bedrock */
export async function advanceTurnBedrock(
    state: GameState,
    playerInput: string
): Promise<LLMResponse> {
    const systemPrompt = `あなたは一人用TRPGのゲームマスターです。プレイヤーの行動に対する結果を描写し、物語を劇的に進行させてください。

重要ルール:
- 【物語の進行】同じ描写や現状維持を繰り返さないこと。プレイヤーの行動により必ず新しい情報、変化、または次の展開を発生させてください。
- 【状態管理】状態の管理はアプリ側で行うため、前進があった場合は積極的に statePatch (フラグ追加、リソース増減、目的更新) を発行してください。
- 【判定の要求】技能判定が必要な初回の行動時のみ checkRequest を含めてください（このターンの描写は「判定直前」で寸止めします）。
- 【判定結果の処理】プレイヤーの最新の行動が「[システム] プレイヤーは〜判定を行いました。結果は〜です。」という形式だった場合、絶対に checkRequest を再度発行してはいけません。既にダイスは振られたため、その判定の成否に従って結果を描写し、必ず状態を進行（statePatchなどを発行）させてください。
- 【選択肢】プレイヤーの次の行動を促すため、choices で2〜3個の選択肢を提示してください。
- 【結末】目的を達成した、あるいは致命的な失敗をした場合は endSignal を含めてください。

必ず以下のJSONスキーマに沿って出力してください（不要なフィールドは省略可）。Markdownのコードブロックは使用禁止です。
{
  "playerFacingText": "行動の結果と、変化した新しい状況の描写（繰り返しを避ける）",
  "choices": ["直感的な選択肢", "慎重な選択肢", "別の視点"],
  "checkRequest": {
    "skill": "要求する技能名",
    "difficulty": "normal",
    "purpose": "判定の目的",
    "failureHint": "失敗時のリスク"
  },
  "statePatch": {
    "flagsAdd": ["得られた新情報や達成フラグ"],
    "objective": "状況変化に伴う新しい目的"
  },
  "endSignal": {
    "type": "success",
    "reason": "終了理由"
  }
}`;

    const userPrompt = `現在のPC状態:
- 目的: ${state.world.objective}
- 所持品: ${state.pc.inventory.join(', ')}
- 重要フラグ: ${state.world.flags.join(', ')}

これまでのログ（直近数件）:
${state.log.messages.slice(-5).map(m => `[${m.type}] ${m.text}`).join('\n')}

====
プレイヤーの最新の行動:
${playerInput}`;

    let lastError = null;
    for (let i = 0; i < 3; i++) {
        try {
            const responseText = await invokeClaude(systemPrompt, userPrompt);
            return extractJson(responseText) as LLMResponse;
        } catch (e) {
            lastError = e;
            console.warn(`JSON parse failed on attempt ${i + 1}, retrying...`, e);
        }
    }

    // Fallback if formatting continuously fails
    return {
        playerFacingText: "（システムエラー：GMの思考が乱れました。別の行動を試すか、もう一度入力してください。）",
        choices: ["もう一度試す", "周囲をよく見る"]
    };
}
