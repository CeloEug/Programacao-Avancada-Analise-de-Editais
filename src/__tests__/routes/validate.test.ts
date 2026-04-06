import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { validateRouter } from '../../routes/validate.js';
import { validateProject } from '../../services/validate.js';

vi.mock('../../services/validate.js', () => ({ validateProject: vi.fn() }));

const app = express();
app.use(express.json());
app.use(validateRouter);

describe('POST /validate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with ValidationOutput on valid request', async () => {
    vi.mocked(validateProject).mockResolvedValueOnce({
      ok: ['req met'],
      faltando: [],
      sugestoes: ['add budget'],
    });
    const res = await request(app)
      .post('/validate')
      .send({ requisitos: 'req text', projeto: 'project text' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toEqual(['req met']);
  });

  it('returns 400 when requisitos is missing', async () => {
    const res = await request(app).post('/validate').send({ projeto: 'text' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('requisitos');
  });

  it('returns 400 when requisitos is empty string', async () => {
    const res = await request(app).post('/validate').send({ requisitos: '  ', projeto: 'text' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when projeto is missing', async () => {
    const res = await request(app).post('/validate').send({ requisitos: 'text' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('projeto');
  });

  it('returns 400 when projeto is empty string', async () => {
    const res = await request(app).post('/validate').send({ requisitos: 'text', projeto: '' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when requisitos is not a string', async () => {
    const res = await request(app).post('/validate').send({ requisitos: 123, projeto: 'text' });
    expect(res.status).toBe(400);
  });

  it('returns 500 when validateProject throws', async () => {
    vi.mocked(validateProject).mockRejectedValueOnce(new Error('LLM fail'));
    const res = await request(app)
      .post('/validate')
      .send({ requisitos: 'req', projeto: 'proj' });
    expect(res.status).toBe(500);
  });
});
