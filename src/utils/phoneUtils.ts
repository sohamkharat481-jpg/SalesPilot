export interface PhoneNormalizeResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}

export function normalizePhoneNumber(phone?: string): PhoneNormalizeResult {
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return { valid: false, error: 'Phone number is missing or empty.' };
  }

  const trimmed = phone.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length < 7) {
    return { valid: false, error: 'Phone number must contain at least 7 digits.' };
  }

  // Reject suspicious repetitive / bogus strings e.g. 00000000
  if (/^0+$/.test(digitsOnly) || /^1+$/.test(digitsOnly)) {
    return { valid: false, error: 'Invalid or dummy phone number provided.' };
  }

  // If starts with +, preserve international prefix
  if (trimmed.startsWith('+')) {
    return { valid: true, normalized: '+' + digitsOnly };
  }

  // Indian phone number heuristic: 10 digits starting with 6,7,8,9
  if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
    return { valid: true, normalized: `+91${digitsOnly}` };
  }

  // US/North America heuristic: 10 digits starting with 2-9
  if (digitsOnly.length === 10 && /^[2-9]/.test(digitsOnly)) {
    return { valid: true, normalized: `+1${digitsOnly}` };
  }

  // 11 digits starting with 1 (US)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return { valid: true, normalized: `+${digitsOnly}` };
  }

  // Default: prepend +
  return { valid: true, normalized: `+${digitsOnly}` };
}
