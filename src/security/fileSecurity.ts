import path from 'path';

export function sanitizeFilePath(baseDir: string, userPath: string): string | null {
  const safePath = path.normalize(userPath).replace(/^(\.\.[\/\\])+/, '');
  const resolvedPath = path.resolve(baseDir, safePath);
  
  if (!resolvedPath.startsWith(path.resolve(baseDir))) {
    console.warn(`🚨 [SECURITY] Path traversal attempt blocked: ${userPath}`);
    return null;
  }
  return resolvedPath;
}

export function validateFileUpload(file: { originalname?: string; size?: number; mimetype?: string }) {
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
  const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml',
    'application/pdf', 'text/csv', 'application/json', 'text/plain'
  ];

  if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, reason: 'File size exceeds 10MB limit' };
  }

  if (file.mimetype && !ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    return { valid: false, reason: `Unsupported file type: ${file.mimetype}` };
  }

  if (file.originalname && file.originalname.includes('..')) {
    return { valid: false, reason: 'Invalid filename' };
  }

  return { valid: true };
}

// Redact secret strings (API keys, tokens) before logging or sending in API responses
export function redactSecretsFromResponse(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') {
    return data.replace(/(sk-[a-zA-Z0-9]{20,})|(AIzaSy[a-zA-Z0-9_-]{33})|(sb_publishable_[a-zA-Z0-9_-]+)/g, '[REDACTED_SECRET]');
  }
  if (Array.isArray(data)) return data.map(redactSecretsFromResponse);
  if (typeof data === 'object') {
    const redacted: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      if (['password', 'secret', 'apiKey', 'token', 'access_token', 'refresh_token'].includes(key.toLowerCase())) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSecretsFromResponse(data[key]);
      }
    }
    return redacted;
  }
  return data;
}
