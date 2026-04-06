import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

const { mockParse } = vi.hoisted(() => ({ mockParse: vi.fn() }));

vi.mock('openai', () => {
  class MockOpenAI {
    responses = { parse: mockParse };
  }
  class APIError extends Error {
    status?: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }
  return { default: MockOpenAI, APIError };
});

import { callStructuredLLM } from '../../llm/client.js';

const TestSchema = z.object({
  value: z.string(),
});

describe('callStructuredLLM', () => {
  const originalKey = process.env.OPENAI_API_KEY;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalKey;
    consoleErrorSpy.mockRestore();
  });

  it('throws when OPENAI_API_KEY is missing', async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(callStructuredLLM('system', 'user', TestSchema, 'test_schema')).rejects.toThrow('OPENAI_API_KEY is missing or empty');
  });

  it('throws when OPENAI_API_KEY is empty string', async () => {
    process.env.OPENAI_API_KEY = '   ';
    await expect(callStructuredLLM('system', 'user', TestSchema, 'test_schema')).rejects.toThrow('OPENAI_API_KEY is missing or empty');
  });

  it('throws when schema name is empty', async () => {
    await expect(callStructuredLLM('system', 'user', TestSchema, '   ')).rejects.toThrow('callStructuredLLM expects a non-empty schema name');
  });

  it('returns parsed response on success', async () => {
    mockParse.mockResolvedValueOnce({
      output_parsed: { value: 'hello world' },
      output: [],
    });
    const result = await callStructuredLLM('system instructions', 'user content', TestSchema, 'test_schema');
    expect(result).toEqual({ parsed: { value: 'hello world' }, refusal: null });
    expect(mockParse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5.4',
        instructions: 'system instructions',
        input: 'user content',
        text: expect.objectContaining({
          format: expect.objectContaining({ type: 'json_schema' }),
        }),
      })
    );
  });

  it('returns refusal when the model refuses', async () => {
    mockParse.mockResolvedValueOnce({
      output_parsed: null,
      output: [
        {
          type: 'message',
          content: [{ type: 'refusal', refusal: 'I cannot help with that.' }],
        },
      ],
    });
    const result = await callStructuredLLM('system', 'prompt', TestSchema, 'test_schema');
    expect(result).toEqual({ parsed: null, refusal: 'I cannot help with that.' });
  });

  it('returns parsed output_text content when output_parsed is null', async () => {
    mockParse.mockResolvedValueOnce({
      output_parsed: null,
      output: [
        {
          type: 'message',
          content: [{ type: 'output_text', text: '{"value":"fallback"}', parsed: { value: 'fallback' } }],
        },
      ],
    });
    const result = await callStructuredLLM('system', 'prompt', TestSchema, 'test_schema');
    expect(result).toEqual({ parsed: { value: 'fallback' }, refusal: null });
  });

  it('throws when response has neither parsed content nor refusal', async () => {
    mockParse.mockResolvedValueOnce({ output_parsed: null, output: [] });
    await expect(callStructuredLLM('system', 'prompt', TestSchema, 'test_schema')).rejects.toThrow('OpenAI returned an empty structured response');
  });

  it('wraps APIError with status code', async () => {
    const { APIError } = await import('openai');
    const apiErr = new (APIError as new (s: number, m: string) => Error)(401, 'Unauthorized');
    mockParse.mockRejectedValueOnce(apiErr);
    await expect(callStructuredLLM('system', 'prompt', TestSchema, 'test_schema')).rejects.toThrow('OpenAI request failed (401)');
  });

  it('re-throws plain Error unchanged', async () => {
    const err = new Error('network timeout');
    mockParse.mockRejectedValueOnce(err);
    await expect(callStructuredLLM('system', 'prompt', TestSchema, 'test_schema')).rejects.toThrow('network timeout');
  });
});
