import { Router, type Request, type Response } from 'express';
import { generateInitialScenario, advanceTurn } from '../services/mockLlm';
import type { ChatRequest, ChatResponse } from '../types/api';

const router = Router();

router.post('/', (req: Request<{}, {}, ChatRequest>, res: Response<ChatResponse>) => {
    try {
        const { state, input, isInitial, theme, pcName } = req.body;

        if (!state) {
            return res.status(400).json({ error: 'GameState is required' });
        }

        if (isInitial) {
            // First turn: generate scenario
            const name = pcName || state.pc.profile.name || '探索者';
            const scenarioTheme = theme || state.session.theme || '';
            const scenario = generateInitialScenario(name, scenarioTheme);

            return res.json({ initialScenario: scenario });
        } else {
            // Subsequent turns
            if (!input) {
                return res.status(400).json({ error: 'Input is required for subsequent turns' });
            }

            const response = advanceTurn(state, input);
            return res.json({ llmResponse: response });
        }
    } catch (error) {
        console.error('Error in chat API:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
