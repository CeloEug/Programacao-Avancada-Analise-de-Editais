import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callLLM } from '../../llm/client.js';
import { extractEdital } from '../../services/extract.js';

vi.mock('../../llm/client.js', () => ({ callLLM: vi.fn() }));

describe('extractEdital', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns full ExtractionOutput for valid JSON', async () => {
    vi.mocked(callLLM).mockResolvedValueOnce(
      JSON.stringify({ prazo: '2025-12-31', criterios: ['C1', 'C2'], formato: 'PDF', temas: ['T1'] })
    );
    const result = await extractEdital('edital text');
    expect(result).toEqual({ prazo: '2025-12-31', criterios: ['C1', 'C2'], formato: 'PDF', temas: ['T1'] });
  });

  it('strips markdown json fence before parsing', async () => {
    vi.mocked(callLLM).mockResolvedValueOnce(
      '```json\n{"prazo":"2025-01-01","criterios":[],"formato":"A4","temas":[]}\n```'
    );
    const result = await extractEdital('edital');
    expect(result.prazo).toBe('2025-01-01');
    expect(result.formato).toBe('A4');
  });

  it('coerces non-string prazo to empty string', async () => {
    vi.mocked(callLLM).mockResolvedValueOnce(
      JSON.stringify({ prazo: 123, criterios: [], formato: '', temas: [] })
    );
    const result = await extractEdital('text');
    expect(result.prazo).toBe('');
  });

  it('coerces non-array criterios to []', async () => {
    vi.mocked(callLLM).mockResolvedValueOnce(
      JSON.stringify({ prazo: '', criterios: 'not array', formato: '', temas: [] })
    );
    const result = await extractEdital('text');
    expect(result.criterios).toEqual([]);
  });

  it('coerces non-array temas to []', async () => {
    vi.mocked(callLLM).mockResolvedValueOnce(
      JSON.stringify({ prazo: '', criterios: [], formato: '', temas: null })
    );
    const result = await extractEdital('text');
    expect(result.temas).toEqual([]);
  });

  it('maps criterios array items through String()', async () => {
    vi.mocked(callLLM).mockResolvedValueOnce(
      JSON.stringify({ prazo: '', criterios: [1, true, 'ok'], formato: '', temas: [] })
    );
    const result = await extractEdital('text');
    expect(result.criterios).toEqual(['1', 'true', 'ok']);
  });

  it('returns empty-but-valid output on JSON parse failure', async () => {
    vi.mocked(callLLM).mockResolvedValueOnce('not json at all');
    const result = await extractEdital('text');
    expect(result).toEqual({ prazo: '', criterios: [], formato: '', temas: [] });
  });
});
