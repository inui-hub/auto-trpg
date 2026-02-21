import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chat', chatRouter);

// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Auto-TRPG Backend running on http://localhost:${PORT}`);
});
