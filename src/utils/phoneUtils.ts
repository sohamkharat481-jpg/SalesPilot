import { COUNTRIES, findCountryByIso, Country } from './countries';

export interface PhoneNormalizeResult {
  valid: boolean;
  normalized?: string;
  error?: string;
  country?: Country;
  callingCode?: string;
  nationalNumber?: string;
  telUri?: string;
}

/**
 * Validates and normalizes any international phone number into strict E.164 format.
 * Works seamlessly with both Native Dialer (tel:+<E164>) and Provider Calling (Edesy/Twilio).
 */
export function normalizePhoneNumber(phone?: string, defaultCountryIso?: string): PhoneNormalizeResult {
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return { valid: false, error: 'Phone number is missing or empty.' };
  }

  const raw = phone.trim();
  const digitsOnly = raw.replace(/\D/g, '');

  if (digitsOnly.length < 5) {
    return { valid: false, error: 'Phone number must contain at least 5 digits.' };
  }

  if (digitsOnly.length > 15) {
    return { valid: false, error: 'Phone number exceeds maximum international E.164 length of 15 digits.' };
  }

  // Reject dummy repeating numbers e.g. 00000000, 11111111
  if (/^0{5,}$/.test(digitsOnly) || /^1{6,}$/.test(digitsOnly)) {
    return { valid: false, error: 'Invalid or dummy phone number provided.' };
  }

  // If explicit + prefix is provided:
  if (raw.startsWith('+')) {
    const e164 = `+${digitsOnly}`;
    // Match against known dial codes
    let matchedCountry: Country | undefined;
    for (let len = 4; len >= 1; len--) {
      const prefix = `+${digitsOnly.slice(0, len)}`;
      const found = COUNTRIES.find(c => c.dialCode === prefix);
      if (found) {
        matchedCountry = found;
        break;
      }
    }

    return {
      valid: true,
      normalized: e164,
      callingCode: matchedCountry?.dialCode || `+${digitsOnly.slice(0, 3)}`,
      nationalNumber: matchedCountry ? digitsOnly.slice(matchedCountry.dialCode.length - 1) : digitsOnly,
      country: matchedCountry,
      telUri: `tel:${e164}`
    };
  }

  // If explicit country ISO or dial code passed
  if (defaultCountryIso) {
    const defaultCountry = findCountryByIso(defaultCountryIso) || 
      COUNTRIES.find(c => c.dialCode === defaultCountryIso || c.dialCode === `+${defaultCountryIso.replace(/\D/g, '')}`);
    
    if (defaultCountry) {
      const dialDigits = defaultCountry.dialCode.replace(/\D/g, '');
      let finalDigits = digitsOnly;
      if (finalDigits.startsWith(dialDigits)) {
        // Already contains dial code without +
      } else {
        finalDigits = `${dialDigits}${digitsOnly}`;
      }
      const e164 = `+${finalDigits}`;
      return {
        valid: true,
        normalized: e164,
        callingCode: defaultCountry.dialCode,
        nationalNumber: digitsOnly,
        country: defaultCountry,
        telUri: `tel:${e164}`
      };
    }
  }

  // If starts with 00 (international call prefix), treat 00 as +
  if (raw.startsWith('00') && digitsOnly.length >= 7) {
    const e164 = `+${digitsOnly.slice(2)}`;
    return {
      valid: true,
      normalized: e164,
      telUri: `tel:${e164}`
    };
  }

  // Standard heuristics when no country code is specified:
  // 11 digits starting with 1 -> US/Canada +1
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    const e164 = `+${digitsOnly}`;
    return {
      valid: true,
      normalized: e164,
      callingCode: '+1',
      nationalNumber: digitsOnly.slice(1),
      country: findCountryByIso('US'),
      telUri: `tel:${e164}`
    };
  }

  // Indian phone number heuristic: 10 digits starting with 6,7,8,9
  if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
    const e164 = `+91${digitsOnly}`;
    return {
      valid: true,
      normalized: e164,
      callingCode: '+91',
      nationalNumber: digitsOnly,
      country: findCountryByIso('IN'),
      telUri: `tel:${e164}`
    };
  }

  // US 10 digits starting with 2-9
  if (digitsOnly.length === 10 && /^[2-9]/.test(digitsOnly)) {
    const e164 = `+1${digitsOnly}`;
    return {
      valid: true,
      normalized: e164,
      callingCode: '+1',
      nationalNumber: digitsOnly,
      country: findCountryByIso('US'),
      telUri: `tel:${e164}`
    };
  }

  // Fallback: prepend + to digits
  const fallbackE164 = `+${digitsOnly}`;
  return {
    valid: true,
    normalized: fallbackE164,
    telUri: `tel:${fallbackE164}`
  };
}

/**
 * Validates a number against a specific selected calling code and local input
 */
export function validateAndFormatPhoneNumber(
  localNumber: string,
  callingCode: string
): { valid: boolean; e164?: string; error?: string } {
  if (!localNumber || !localNumber.trim()) {
    return { valid: false, error: 'Phone number is required.' };
  }
  if (!callingCode || !callingCode.startsWith('+')) {
    return { valid: false, error: 'Missing or invalid international calling code.' };
  }

  const cleanCallingCode = callingCode.trim();
  const cleanLocal = localNumber.trim().replace(/\D/g, '');

  if (cleanLocal.length < 5) {
    return { valid: false, error: 'Phone number is too short (minimum 5 digits).' };
  }

  if (cleanLocal.length > 14) {
    return { valid: false, error: 'Phone number is too long (maximum 14 local digits).' };
  }

  // Dummy number checks
  if (/^0{5,}$/.test(cleanLocal) || /^1{6,}$/.test(cleanLocal)) {
    return { valid: false, error: 'Invalid or dummy phone number provided.' };
  }

  const e164 = `${cleanCallingCode}${cleanLocal}`;
  const totalDigits = e164.replace(/\D/g, '');

  if (totalDigits.length > 15) {
    return { valid: false, error: 'Total E.164 number exceeds international limit of 15 digits.' };
  }

  return { valid: true, e164 };
}

/**
 * Normalizes a number to E.164 string format.
 */
export function normalizeToE164(phone?: string, defaultCountryIso?: string): PhoneNormalizeResult {
  return normalizePhoneNumber(phone, defaultCountryIso);
}

/**
 * Validates whether a string matches valid E.164 format (+ followed by 7-15 digits).
 */
export function isValidE164(phone?: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  return /^\+[1-9]\d{6,14}$/.test(phone.trim());
}

/**
 * Returns the tel: URI for native dialer launch.
 */
export function getNativeDialerUrl(phone: string): string {
  const norm = normalizePhoneNumber(phone);
  if (norm.valid && norm.normalized) {
    return `tel:${norm.normalized}`;
  }
  const clean = phone.replace(/[^\d+]/g, '');
  return clean.startsWith('+') ? `tel:${clean}` : `tel:+${clean}`;
}

