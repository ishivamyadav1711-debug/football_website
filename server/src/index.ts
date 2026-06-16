import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import liveRouter from './routes/live';
import fixturesRouter from './routes/fixtures';
import standingsRouter from './routes/standings';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/matches/live', liveRouter);
app.use('/api/fixtures', fixturesRouter);
app.use('/api/standings', standingsRouter);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sports API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
