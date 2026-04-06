import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { pipelineRouter } from '../../routes/pipeline.js';
import { runPipeline } from '../../services/pipeline.js';

vi.mock('../../services/pipeline.js', () => ({ runPipeline: vi.fn() }));

const app = express();
app.use(express.json());
app.use(pipelineRouter);

const validBody = {
  editalText: 'edital content',
  titulo: 'My Project',
  descricao: 'A description',
  objetivos: 'Objectives here',
  metodologia: 'Methods',
  orcamento: 'R$ 50.000',
  equipe: '2 researchers',
};

describe('POST /pipeline', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with PipelineOutput for valid request', async () => {
    vi.mocked(runPipeline).mockResolvedValueOnce({
      projeto: 'full project draft',
      checklist: { req1: 'ok' },
    });
    const res = await request(app).post('/pipeline').send(validBody);
    expect(res.status).toBe(200);
    expect(res.body.projeto).toBe('full project draft');
  });

  it('trims fields before passing to runPipeline', async () => {
    vi.mocked(runPipeline).mockResolvedValueOnce({ projeto: 'x', checklist: {} });
    await request(app)
      .post('/pipeline')
      .send({ ...validBody, titulo: '  My Project  ' });
    expect(vi.mocked(runPipeline)).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: 'My Project' })
    );
  });

  it.each([
    'editalText', 'titulo', 'descricao', 'objetivos', 'metodologia', 'orcamento', 'equipe',
  ] as const)('returns 400 when %s is missing', async (field) => {
    const body = { ...validBody };
    delete (body as Record<string, unknown>)[field];
    const res = await request(app).post('/pipeline').send(body);
    expect(res.status).toBe(400);
  });

  it('returns 400 when a field is whitespace-only', async () => {
    const res = await request(app).post('/pipeline').send({ ...validBody, titulo: '   ' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when body is not an object', async () => {
    const res = await request(app)
      .post('/pipeline')
      .set('Content-Type', 'application/json')
      .send('"just a string"');
    expect(res.status).toBe(400);
  });

  it('returns 500 when runPipeline throws', async () => {
    vi.mocked(runPipeline).mockRejectedValueOnce(new Error('LLM error'));
    const res = await request(app).post('/pipeline').send(validBody);
    expect(res.status).toBe(500);
  });
});
