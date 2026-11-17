/**
 * TrainTrack Security Utilities
 * Implements defenses guided by OWASP Top 10 Web Application Security:
 * - A03:2021 Injection (HTML/Email/CSV Injection)
 * - A04:2021 Insecure Design
 * - A05:2021 Security Misconfiguration
 */

/**
 * Escapes HTML characters to prevent XSS and HTML injection in HTML contexts (like emails and rich previews).
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Strips dangerous control characters and null bytes from plain text.
 */
export function sanitizeText(input: string | null | undefined, maxLength = 2000): string {
  if (!input) return '';
  // Remove null bytes and control chars (except newline and tab)
  const cleaned = String(input)
    .replace(/\0/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned.slice(0, maxLength).trim();
}

/**
 * Sanitizes input for CSV export to prevent CSV / Formula Injection (CWE-1236).
 * If a cell starts with =, +, -, @, \t, or \r, spreadsheets (Excel, LibreOffice, Google Sheets)
 * may interpret it as a formula or shell command execution.
 */
export function sanitizeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);

  // If starts with dangerous formula triggers, prepend a single quote to force text interpretation
  const dangerousTriggers = ['=', '+', '-', '@', '\t', '\r'];
  const safeStr = dangerousTriggers.some((t) => str.startsWith(t)) ? `'${str}` : str;

  // Escape inner double quotes by doubling them
  return `"${safeStr.replace(/"/g, '""')}"`;
}

/**
 * Validates email addresses and blocks Carriage Return / Line Feed (CRLF) header injection.
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  // Block any CRLF or null bytes
  if (/[\r\n\0]/.test(email)) return false;
  if (email.length > 254) return false;

  // RFC 5322 compliant simplified regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}

/**
 * Validates allowed notification types against strict whitelist.
 */
export const ALLOWED_NOTIFICATION_TYPES = [
  'pending_mentor',
  'pending_lead',
  'approved',
  'revision_required',
] as const;

export type AllowedNotificationType = (typeof ALLOWED_NOTIFICATION_TYPES)[number];

export function isAllowedNotificationType(type: string): type is AllowedNotificationType {
  return ALLOWED_NOTIFICATION_TYPES.includes(type as AllowedNotificationType);
}

