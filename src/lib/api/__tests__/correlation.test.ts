import { describe, it, expect, vi } from 'vitest';
import { getRequestId, CORRELATION_HEADER } from '../correlation';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('Correlation ID Helper', () => {
  it('should return correlation ID from header if present', async () => {
    const { headers } = await import('next/headers');
    vi.mocked(headers).mockResolvedValueOnce({
      get: (name: string) => (name === CORRELATION_HEADER ? 'existing-req-id-123' : null),
    } as never);

    const id = await getRequestId();
    expect(id).toBe('existing-req-id-123');
  });

  it('should generate fallback correlation ID if header is missing or empty', async () => {
    const { headers } = await import('next/headers');
    vi.mocked(headers).mockResolvedValueOnce({
      get: () => '',
    } as never);

    const id = await getRequestId();
    expect(id).toMatch(/^req_/);
  });

  it('should generate fallback correlation ID if headers() throws error', async () => {
    const { headers } = await import('next/headers');
    vi.mocked(headers).mockRejectedValueOnce(new Error('Outside request context'));

    const id = await getRequestId();
    expect(id).toMatch(/^req_/);
  });
});
