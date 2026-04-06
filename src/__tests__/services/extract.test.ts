import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callStructuredLLM } from '../../llm/client.js';
import { extractEdital } from '../../services/extract.js';

vi.mock('../../llm/client.js', () => ({ callStructuredLLM: vi.fn() }));

describe('extractEdital', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns full ExtractionOutput for parsed structured output', async () => {
    vi.mocked(callStructuredLLM).mockResolvedValueOnce({
      parsed: { prazo: '2025-12-31', criterios: ['C1', 'C2'], formato: 'PDF', temas: ['T1'] },
      refusal: null,
    });
    const result = await extractEdital('edital text');
    expect(result).toEqual({ prazo: '2025-12-31', criterios: ['C1', 'C2'], formato: 'PDF', temas: ['T1'] });
  });

  it('returns empty-but-valid output on refusal', async () => {
    vi.mocked(callStructuredLLM).mockResolvedValueOnce({
      parsed: null,
      refusal: 'cannot comply',
    });
    const result = await extractEdital('edital');
    expect(result).toEqual({ prazo: '', criterios: [], formato: '', temas: [] });
  });

  it('passes a schema-backed prompt to the LLM client', async () => {
    vi.mocked(callStructuredLLM).mockResolvedValueOnce({
      parsed: { prazo: '', criterios: [], formato: '', temas: [] },
      refusal: null,
    });
    await extractEdital('texto do edital');
    expect(callStructuredLLM).toHaveBeenCalledWith(
      expect.stringContaining('texto do edital'),
      expect.anything(),
      'extraction_output'
    );
  });
});
