import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { extractRouter } from '../../routes/extract.js';
import { extractEdital } from '../../services/extract.js';

vi.mock('../../services/extract.js', () => ({ extractEdital: vi.fn() }));

const app = express();
app.use(express.json());
app.use(extractRouter);

describe('POST /extract', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with ExtractionOutput on valid request', async () => {
    vi.mocked(extractEdital).mockResolvedValueOnce({
      prazo: '2025-12-31',
      criterios: ['C1'],
      formato: 'PDF',
      temas: ['T1'],
    });
    const res = await request(app)
      .post('/extract')
      .send({ editalText: 'some edital text' });
    expect(res.status).toBe(200);
    expect(res.body.prazo).toBe('2025-12-31');
  });

  it('returns 400 when editalText is missing', async () => {
    const res = await request(app).post('/extract').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('editalText');
  });

  it('returns 400 when editalText is empty string', async () => {
    const res = await request(app).post('/extract').send({ editalText: '   ' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when editalText is not a string', async () => {
    const res = await request(app).post('/extract').send({ editalText: 42 });
    expect(res.status).toBe(400);
  });

  it('returns 500 when extractEdital throws', async () => {
    vi.mocked(extractEdital).mockRejectedValueOnce(new Error('LLM error'));
    const res = await request(app).post('/extract').send({ editalText: 'valid' });
    expect(res.status).toBe(500);
  });
});
