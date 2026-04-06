import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { uploadRouter } from '../../routes/upload.js';
import { parsePDF } from '../../services/ingest.js';

vi.mock('../../services/ingest.js', () => ({ parsePDF: vi.fn() }));

const app = express();
app.use(uploadRouter);

describe('POST /upload', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with extracted text on valid file upload', async () => {
    vi.mocked(parsePDF).mockResolvedValueOnce('extracted pdf text');
    const res = await request(app)
      .post('/upload')
      .attach('file', Buffer.from('%PDF-test'), 'test.pdf');
    expect(res.status).toBe(200);
    expect(res.body.text).toBe('extracted pdf text');
  });

  it('returns 400 when no file is uploaded', async () => {
    const res = await request(app).post('/upload');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('No file uploaded');
  });

  it('returns 500 when parsePDF throws', async () => {
    vi.mocked(parsePDF).mockRejectedValueOnce(new Error('corrupt PDF'));
    const res = await request(app)
      .post('/upload')
      .attach('file', Buffer.from('%PDF-test'), 'test.pdf');
    expect(res.status).toBe(500);
  });
});
