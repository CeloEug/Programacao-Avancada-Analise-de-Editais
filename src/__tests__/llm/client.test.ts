import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock('openai', () => {
  class MockOpenAI {
    chat = { completions: { create: mockCreate } };
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

import { callLLM } from '../../llm/client.js';

describe('callLLM', () => {
  const originalKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalKey;
  });

  it('throws when OPENAI_API_KEY is missing', async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(callLLM('test')).rejects.toThrow('OPENAI_API_KEY is missing or empty');
  });

  it('throws when OPENAI_API_KEY is empty string', async () => {
    process.env.OPENAI_API_KEY = '   ';
    await expect(callLLM('test')).rejects.toThrow('OPENAI_API_KEY is missing or empty');
  });

  it('throws when prompt is not a string', async () => {
    // @ts-expect-error intentional wrong type
    await expect(callLLM(42)).rejects.toThrow('callLLM expects a string prompt');
  });

  it('returns trimmed response on success', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: '  hello world  ' } }],
    });
    const result = await callLLM('some prompt');
    expect(result).toBe('hello world');
  });

  it('throws when response content is null', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    });
    await expect(callLLM('prompt')).rejects.toThrow('OpenAI returned an empty response');
  });

  it('throws when response content is empty string', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: '   ' } }],
    });
    await expect(callLLM('prompt')).rejects.toThrow('OpenAI returned an empty response');
  });

  it('wraps APIError with status code', async () => {
    const { APIError } = await import('openai');
    const apiErr = new (APIError as new (s: number, m: string) => Error)(401, 'Unauthorized');
    mockCreate.mockRejectedValueOnce(apiErr);
    await expect(callLLM('prompt')).rejects.toThrow('OpenAI request failed (401)');
  });

  it('re-throws plain Error unchanged', async () => {
    const err = new Error('network timeout');
    mockCreate.mockRejectedValueOnce(err);
    await expect(callLLM('prompt')).rejects.toThrow('network timeout');
  });
});
