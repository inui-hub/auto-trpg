import { Router, Request, Response } from 'express';
import { generateInitialScenario, advanceTurn } from '../services/mockLlm';
import { generateInitialScenarioBedrock, advanceTurnBedrock } from '../services/bedrockLlm';
import type { ChatRequest } from '../types/api';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
    try {
        const payload = req.body as ChatRequest;
        const useBedrock = process.env.USE_BEDROCK === 'true';

        if (payload.isInitial) {
            // 新規シナリオ生成
            const name = payload.pcName || payload.state.pc.profile.name || '探索者';
            const scenarioTheme = payload.theme || payload.state.session.theme || '';
            const resp = useBedrock
                ? await generateInitialScenarioBedrock(name, scenarioTheme)
                : generateInitialScenario(name, scenarioTheme);

            res.json({ initialScenario: resp });
        } else {
            // 通常ターン進行
            if (!payload.input) {
                res.status(400).json({ error: 'input is required for advance turn' });
                return;
            }
            const resp = useBedrock
                ? await advanceTurnBedrock(payload.state, payload.input)
                : advanceTurn(payload.state, payload.input);

            res.json({ llmResponse: resp });
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
