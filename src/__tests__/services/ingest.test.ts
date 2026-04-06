import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDestroy, mockGetText, mockPDFParse } = vi.hoisted(() => ({
  mockDestroy: vi.fn(),
  mockGetText: vi.fn(),
  mockPDFParse: vi.fn(),
}));

vi.mock('pdf-parse', () => ({ PDFParse: mockPDFParse }));

import { parsePDF } from '../../services/ingest.js';

describe('parsePDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDestroy.mockResolvedValue(undefined);
    mockPDFParse.mockImplementation(function (this: Record<string, unknown>) {
      this.getText = mockGetText;
      this.destroy = mockDestroy;
    });
  });

  it('calls PDFParse with { data: buffer }', async () => {
    const buf = Buffer.from('test');
    mockGetText.mockResolvedValueOnce({ text: 'content' });
    await parsePDF(buf);
    expect(mockPDFParse).toHaveBeenCalledWith({ data: buf });
  });

  it('returns cleaned text from getText()', async () => {
    mockGetText.mockResolvedValueOnce({ text: 'hello world' });
    const result = await parsePDF(Buffer.from('x'));
    expect(result).toBe('hello world');
  });

  it('normalizes CRLF to LF', async () => {
    mockGetText.mockResolvedValueOnce({ text: 'line1\r\nline2' });
    const result = await parsePDF(Buffer.from('x'));
    expect(result).toBe('line1\nline2');
  });

  it('collapses 3+ consecutive newlines to 2', async () => {
    mockGetText.mockResolvedValueOnce({ text: 'a\n\n\n\nb' });
    const result = await parsePDF(Buffer.from('x'));
    expect(result).toBe('a\n\nb');
  });

  it('collapses multiple spaces to single space', async () => {
    mockGetText.mockResolvedValueOnce({ text: 'a   b  c' });
    const result = await parsePDF(Buffer.from('x'));
    expect(result).toBe('a b c');
  });

  it('trims leading/trailing whitespace', async () => {
    mockGetText.mockResolvedValueOnce({ text: '  hello  ' });
    const result = await parsePDF(Buffer.from('x'));
    expect(result).toBe('hello');
  });

  it('calls destroy() even when getText() throws', async () => {
    mockGetText.mockRejectedValueOnce(new Error('PDF corrupt'));
    await expect(parsePDF(Buffer.from('x'))).rejects.toThrow('PDF corrupt');
    expect(mockDestroy).toHaveBeenCalled();
  });
});
