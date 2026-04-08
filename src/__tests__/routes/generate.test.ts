import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { generateRouter } from '../../routes/generate.js';
import { parsePDF } from '../../services/ingest.js';
import { extractEdital } from '../../services/extract.js';
import { runPipeline } from '../../services/pipeline.js';
import { validateProject } from '../../services/validate.js';

vi.mock('../../services/ingest.js',   () => ({ parsePDF:         vi.fn() }));
vi.mock('../../services/extract.js',  () => ({ extractEdital:    vi.fn() }));
vi.mock('../../services/pipeline.js', () => ({ runPipeline:      vi.fn() }));
vi.mock('../../services/validate.js', () => ({ validateProject:  vi.fn() }));

const app = express();
app.use(generateRouter);

const METADATA = {
  titulo:      'My Project',
  descricao:   'A description',
  objetivos:   'Objectives here',
  metodologia: 'Methods',
  orcamento:   'R$ 50.000',
  equipe:      '2 researchers',
};

const MOCK_REQUISITOS = { prazo: '2025-12-31', criterios: ['C1'], formato: 'PDF', temas: ['T1'] };
const MOCK_PIPELINE   = { projeto: 'full draft', checklist: { req1: 'ok' } };
const MOCK_VALIDACAO  = { ok: ['req met'], faltando: [], sugestoes: ['add budget'] };

function setupHappyPath() {
  vi.mocked(parsePDF).mockResolvedValueOnce('extracted text');
  vi.mocked(extractEdital).mockResolvedValueOnce(MOCK_REQUISITOS);
  vi.mocked(runPipeline).mockResolvedValueOnce(MOCK_PIPELINE);
  vi.mocked(validateProject).mockResolvedValueOnce(MOCK_VALIDACAO);
}

describe('POST /generate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with all pipeline stages on valid request', async () => {
    setupHappyPath();
    const res = await request(app)
      .post('/generate')
      .attach('file', Buffer.from('%PDF-test'), 'edital.pdf')
      .field(METADATA);

    expect(res.status).toBe(200);
    expect(res.body.requisitos).toEqual(MOCK_REQUISITOS);
    expect(res.body.projeto).toBe('full draft');
    expect(res.body.checklist).toEqual({ req1: 'ok' });
    expect(res.body.validacao).toEqual(MOCK_VALIDACAO);
  });

  it('passes extracted text to extractEdital and runPipeline', async () => {
    setupHappyPath();
    await request(app)
      .post('/generate')
      .attach('file', Buffer.from('%PDF-test'), 'edital.pdf')
      .field(METADATA);

    expect(vi.mocked(extractEdital)).toHaveBeenCalledWith('extracted text');
    expect(vi.mocked(runPipeline)).toHaveBeenCalledWith(
      expect.objectContaining({ editalText: 'extracted text', titulo: 'My Project' })
    );
  });

  it('passes serialized requisitos to validateProject', async () => {
    setupHappyPath();
    await request(app)
      .post('/generate')
      .attach('file', Buffer.from('%PDF-test'), 'edital.pdf')
      .field(METADATA);

    expect(vi.mocked(validateProject)).toHaveBeenCalledWith(
      JSON.stringify(MOCK_REQUISITOS),
      'full draft'
    );
  });

  it('trims whitespace from metadata fields', async () => {
    setupHappyPath();
    await request(app)
      .post('/generate')
      .attach('file', Buffer.from('%PDF-test'), 'edital.pdf')
      .field({ ...METADATA, titulo: '  My Project  ' });

    expect(vi.mocked(runPipeline)).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: 'My Project' })
    );
  });

  it('returns 400 when no file is uploaded', async () => {
    const res = await request(app).post('/generate').field(METADATA);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('file');
  });

  it.each(Object.keys(METADATA) as (keyof typeof METADATA)[])(
    'returns 400 when %s is missing',
    async (field) => {
      const body = { ...METADATA };
      delete (body as Record<string, unknown>)[field];
      const res = await request(app)
        .post('/generate')
        .attach('file', Buffer.from('%PDF-test'), 'edital.pdf')
        .field(body);
      expect(res.status).toBe(400);
    }
  );

  it('returns 400 when a field is whitespace-only', async () => {
    const res = await request(app)
      .post('/generate')
      .attach('file', Buffer.from('%PDF-test'), 'edital.pdf')
      .field({ ...METADATA, titulo: '   ' });
    expect(res.status).toBe(400);
  });

  it('returns 500 when parsePDF throws', async () => {
    vi.mocked(parsePDF).mockRejectedValueOnce(new Error('corrupt PDF'));
    const res = await request(app)
      .post('/generate')
      .attach('file', Buffer.from('%PDF-test'), 'edital.pdf')
      .field(METADATA);
    expect(res.status).toBe(500);
  });

  it('returns 500 when extractEdital throws', async () => {
    vi.mocked(parsePDF).mockResolvedValueOnce('text');
    vi.mocked(extractEdital).mockRejectedValueOnce(new Error('LLM error'));
    const res = await request(app)
      .post('/generate')
      .attach('file', Buffer.from('%PDF-test'), 'edital.pdf')
      .field(METADATA);
    expect(res.status).toBe(500);
  });

  it('returns 500 when runPipeline throws', async () => {
    vi.mocked(parsePDF).mockResolvedValueOnce('text');
    vi.mocked(extractEdital).mockResolvedValueOnce(MOCK_REQUISITOS);
    vi.mocked(runPipeline).mockRejectedValueOnce(new Error('LLM error'));
    const res = await request(app)
      .post('/generate')
      .attach('file', Buffer.from('%PDF-test'), 'edital.pdf')
      .field(METADATA);
    expect(res.status).toBe(500);
  });

  it('returns 500 when validateProject throws', async () => {
    vi.mocked(parsePDF).mockResolvedValueOnce('text');
    vi.mocked(extractEdital).mockResolvedValueOnce(MOCK_REQUISITOS);
    vi.mocked(runPipeline).mockResolvedValueOnce(MOCK_PIPELINE);
    vi.mocked(validateProject).mockRejectedValueOnce(new Error('LLM error'));
    const res = await request(app)
      .post('/generate')
      .attach('file', Buffer.from('%PDF-test'), 'edital.pdf')
      .field(METADATA);
    expect(res.status).toBe(500);
  });
});
