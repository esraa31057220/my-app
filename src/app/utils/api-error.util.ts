import { HttpErrorResponse } from '@angular/common/http';

/**
 * Human-readable message from ASP.NET / Identity error bodies (ModelState, ProblemDetails, plain string).
 */
export function readApiErrorMessage(err: unknown): string | null {
  if (err instanceof HttpErrorResponse) {
    return readApiErrorBody(err.error);
  }
  return readApiErrorBody(err);
}

export function readApiErrorBody(body: unknown): string | null {
  if (typeof body === 'string') {
    const t = body.trim();
    if (!t) return null;
    try {
      const j = JSON.parse(t) as Record<string, unknown>;
      return readApiErrorBody(j);
    } catch {
      return t.length > 200 ? `${t.slice(0, 200)}…` : t;
    }
  }
  if (!body || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;

  const errs = o['errors'];

  // ASP.NET Identity returns errors as an array of {code, description} objects
  if (Array.isArray(errs)) {
    const parts: string[] = [];
    for (const e of errs) {
      if (e && typeof e === 'object') {
        const r = e as Record<string, unknown>;
        const desc = r['description'] ?? r['Description'] ?? r['message'] ?? r['Message'];
        if (desc != null && String(desc).trim()) parts.push(String(desc).trim());
      } else if (typeof e === 'string' && e.trim()) {
        parts.push(e.trim());
      }
    }
    if (parts.length) return parts.join(' ');
  }

  // ModelState errors as a key→string[] object
  if (errs && typeof errs === 'object' && !Array.isArray(errs)) {
    const parts: string[] = [];
    for (const [key, v] of Object.entries(errs as Record<string, unknown>)) {
      const label = key.includes('.') ? key.split('.').pop() ?? key : key;
      if (Array.isArray(v)) {
        for (const x of v) {
          if (x != null && String(x).trim()) parts.push(`${label}: ${String(x).trim()}`);
        }
      } else if (v != null && String(v).trim()) {
        parts.push(`${label}: ${String(v).trim()}`);
      }
    }
    if (parts.length) return parts.join(' ');
  }

  const detail = o['detail'];
  if (typeof detail === 'string' && detail.trim()) return detail.trim();

  const title = o['title'];
  if (typeof title === 'string' && title.trim()) {
    const t = title.trim();
    if (!/validation errors occurred/i.test(t)) return t;
  }

  const message = o['message'];
  if (typeof message === 'string' && message.trim()) return message.trim();

  const msg = o['Message'];
  if (typeof msg === 'string' && msg.trim()) return msg.trim();

  return null;
}