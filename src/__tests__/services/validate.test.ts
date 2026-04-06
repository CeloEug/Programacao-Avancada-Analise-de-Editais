import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callLLM } from '../../llm/client.js';
import { validateProject } from '../../services/validate.js';

vi.mock('../../llm/client.js', () => ({ callLLM: vi.fn() }));

describe('validateProject', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns full ValidationOutput for valid JSON', async () => {
    vi.mocked(callLLM).mockResolvedValueOnce(
      JSON.stringify({ ok: ['r1'], faltando: ['r2'], sugestoes: ['add section'] })
    );
    const result = await validateProject('requirements', 'project text');
    expect(result).toEqual({ ok: ['r1'], faltando: ['r2'], sugestoes: ['add section'] });
  });

  it('strips markdown fence before parsing', async () => {
    vi.mocked(callLLM).mockResolvedValueOnce(
      '```\n{"ok":["x"],"faltando":[],"sugestoes":[]}\n```'
    );
    const result = await validateProject('req', 'proj');
    expect(result.ok).toEqual(['x']);
  });

  it('coerces non-array ok to []', async () => {
    vi.mocked(callLLM).mockResolvedValueOnce(
      JSON.stringify({ ok: 'yes', faltando: [], sugestoes: [] })
    );
    const result = await validateProject('req', 'proj');
    expect(result.ok).toEqual([]);
  });

  it('coerces non-array faltando to []', async () => {
    vi.mocked(callLLM).mockResolvedValueOnce(
      JSON.stringify({ ok: [], faltando: null, sugestoes: [] })
    );
    const result = await validateProject('req', 'proj');
    expect(result.faltando).toEqual([]);
  });

  it('coerces non-array sugestoes to []', async () => {
    vi.mocked(callLLM).mockResolvedValueOnce(
      JSON.stringify({ ok: [], faltando: [], sugestoes: 42 })
    );
    const result = await validateProject('req', 'proj');
    expect(result.sugestoes).toEqual([]);
  });

  it('maps array items through String()', async () => {
    vi.mocked(callLLM).mockResolvedValueOnce(
      JSON.stringify({ ok: [1, 2], faltando: [], sugestoes: [] })
    );
    const result = await validateProject('req', 'proj');
    expect(result.ok).toEqual(['1', '2']);
  });

  it('returns empty arrays on JSON parse failure', async () => {
    vi.mocked(callLLM).mockResolvedValueOnce('broken json {');
    const result = await validateProject('req', 'proj');
    expect(result).toEqual({ ok: [], faltando: [], sugestoes: [] });
  });
});
