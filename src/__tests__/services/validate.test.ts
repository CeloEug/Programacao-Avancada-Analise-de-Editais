import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callStructuredLLM } from '../../llm/client.js';
import { validateProject } from '../../services/validate.js';

vi.mock('../../llm/client.js', () => ({ callStructuredLLM: vi.fn() }));

describe('validateProject', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns full ValidationOutput for parsed structured output', async () => {
    vi.mocked(callStructuredLLM).mockResolvedValueOnce({
      parsed: { ok: ['r1'], faltando: ['r2'], sugestoes: ['add section'] },
      refusal: null,
    });
    const result = await validateProject('requirements', 'project text');
    expect(result).toEqual({ ok: ['r1'], faltando: ['r2'], sugestoes: ['add section'] });
  });

  it('returns empty arrays on refusal', async () => {
    vi.mocked(callStructuredLLM).mockResolvedValueOnce({
      parsed: null,
      refusal: 'cannot comply',
    });
    const result = await validateProject('req', 'proj');
    expect(result).toEqual({ ok: [], faltando: [], sugestoes: [] });
  });

  it('passes the validation schema name to the LLM client', async () => {
    vi.mocked(callStructuredLLM).mockResolvedValueOnce({
      parsed: { ok: [], faltando: [], sugestoes: [] },
      refusal: null,
    });
    await validateProject('req', 'proj');
    expect(callStructuredLLM).toHaveBeenCalledWith(
      expect.stringContaining('Cross-check'),
      expect.stringContaining('req'),
      expect.anything(),
      'validation_output'
    );
  });
});
