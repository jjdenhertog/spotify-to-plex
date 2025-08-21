// Validation utility functions

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);

    return true;
  } catch {
    return false;
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
}

export function isValidISRC(isrc: string): boolean {
  // ISRC format: CC-XXX-YY-NNNNN
  const isrcRegex = /^[A-Z]{2}[\dA-Z]{3}\d{7}$/;

  return isrcRegex.test(isrc.replace(/-/g, ''));
}

export function validateRequired<T>(value: T | undefined | null, fieldName: string): T {
  if (value === undefined || value === null) {
    throw new Error(`${fieldName} is required`);
  }

  return value;
}

export function validateRange(value: number, min: number, max: number, fieldName: string): number {
  if (value < min || value > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }

  return value;
}