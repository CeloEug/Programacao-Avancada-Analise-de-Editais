import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callStructuredLLM } from '../../llm/client.js';
import { runPipeline } from '../../services/pipeline.js';
import type { PipelineInput } from '../../services/pipeline.js';

vi.mock('../../llm/client.js', () => ({ callStructuredLLM: vi.fn() }));

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

  it('returns valid PipelineOutput on successful structured output', async () => {
    vi.mocked(callStructuredLLM).mockResolvedValueOnce({
      parsed: { projeto: 'full draft text', checklist: { req1: true } },
      refusal: null,
    });
    const result = await runPipeline(baseInput);
    expect(result.projeto).toBe('full draft text');
    expect(result.checklist).toEqual({ req1: true });
  });

  it('returns empty output on refusal', async () => {
    vi.mocked(callStructuredLLM).mockResolvedValueOnce({
      parsed: null,
      refusal: 'refused',
    });
    const result = await runPipeline(baseInput);
    expect(result).toEqual({ projeto: '', checklist: {} });
  });

  it('passes the pipeline schema name to the LLM client', async () => {
    vi.mocked(callStructuredLLM).mockResolvedValueOnce({
      parsed: { projeto: 'draft', checklist: {} },
      refusal: null,
    });
    await runPipeline(baseInput);
    expect(callStructuredLLM).toHaveBeenCalledWith(
      expect.stringContaining(baseInput.editalText),
      expect.anything(),
      'pipeline_output'
    );
  });
});
