import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callLLM } from '../../llm/client.js';
import { runPipeline } from '../../services/pipeline.js';
import type { PipelineInput } from '../../services/pipeline.js';

vi.mock('../../llm/client.js', () => ({ callLLM: vi.fn() }));

const baseInput: PipelineInput = {
  editalText: 'edital',
  titulo: 'My Project',
  descricao: 'A description',
  objetivos: 'Some objectives',
  metodologia: 'Method',
  orcamento: 'R$ 50.000',
  equipe: '2 researchers',
};

describe('runPipeline', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns valid PipelineOutput on successful JSON', async () => {
    vi.mocked(callLLM).mockResolvedValueOnce(
      JSON.stringify({ projeto: 'full draft text', checklist: { req1: true } })
    );
    const result = await runPipeline(baseInput);
    expect(result.projeto).toBe('full draft text');
    expect(result.checklist).toEqual({ req1: true });
  });

  it('strips markdown fence before parsing', async () => {
    vi.mocked(callLLM).mockResolvedValueOnce(
      '```json\n{"projeto":"draft","checklist":{}}\n```'
    );
    const result = await runPipeline(baseInput);
    expect(result.projeto).toBe('draft');
  });

  it('uses trimmed string as projeto when parsed.projeto is not a string', async () => {
    const raw = JSON.stringify({ projeto: 123, checklist: {} });
    vi.mocked(callLLM).mockResolvedValueOnce(raw);
    const result = await runPipeline(baseInput);
    // parsed.projeto (123) is not a string, so falls back to trimmed raw
    expect(result.projeto).toBe(raw.trim());
  });

  it('uses {} when parsed.checklist is an array', async () => {
    vi.mocked(callLLM).mockResolvedValueOnce(
      JSON.stringify({ projeto: 'ok', checklist: ['item1'] })
    );
    const result = await runPipeline(baseInput);
    expect(result.checklist).toEqual({});
  });

  it('uses {} when parsed.checklist is null', async () => {
    vi.mocked(callLLM).mockResolvedValueOnce(
      JSON.stringify({ projeto: 'ok', checklist: null })
    );
    const result = await runPipeline(baseInput);
    expect(result.checklist).toEqual({});
  });

  it('returns { projeto: raw, checklist: {} } on JSON parse failure', async () => {
    const raw = 'not valid json {{ broken';
    vi.mocked(callLLM).mockResolvedValueOnce(raw);
    const result = await runPipeline(baseInput);
    expect(result.projeto).toBe(raw);
    expect(result.checklist).toEqual({});
  });
});
