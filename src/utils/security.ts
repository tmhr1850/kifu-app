/**
 * Security utilities for input validation and sanitization
 */

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  const htmlEscapeMap: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return str.replace(/[&<>"'/]/g, char => htmlEscapeMap[char] || char);
}

/**
 * Validate and sanitize username
 * Allows: alphanumeric, Japanese characters, and limited special characters
 */
export function sanitizeUsername(username: string): string {
  // Remove any HTML tags first
  const withoutTags = username.replace(/<[^>]*>/g, '');
  
  // Allow alphanumeric, Japanese (hiragana, katakana, kanji), and some special chars
  const sanitized = withoutTags.replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s\-_.]/g, '');
  
  // Trim and limit length
  return sanitized.trim().slice(0, 20);
}

/**
 * Validate and sanitize profile text
 */
export function sanitizeProfileText(text: string): string {
  // Remove any HTML tags
  const withoutTags = text.replace(/<[^>]*>/g, '');
  
  // Escape remaining special characters
  const escaped = escapeHtml(withoutTags);
  
  // Limit length
  return escaped.slice(0, 500);
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}

/**
 * Validate file extension
 */
export function validateFileExtension(filename: string, allowedExtensions: string[]): boolean {
  const ext = filename.toLowerCase().split('.').pop();
  return !!ext && allowedExtensions.includes(ext);
}

/**
 * Validate kifu file content for malicious patterns
 */
export function validateKifuContent(content: string): { valid: boolean; reason?: string } {
  // Check for suspicious patterns that might indicate code injection
  const suspiciousPatterns = [
    /<script[\s>]/i,
    /<iframe[\s>]/i,
    /<object[\s>]/i,
    /<embed[\s>]/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<img[^>]+src[\\s]*=[\\s]*["\']javascript:/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      return { valid: false, reason: 'File contains potentially malicious content' };
    }
  }
  
  // Check for valid kifu file patterns
  const validPatterns = [
    /^V2\.2/m, // CSA format
    /^#KIF/m, // KIF format
    /^手数/m, // KI2 format
    /先手|後手|手番|指し手/m, // Common shogi terms
  ];
  
  const hasValidPattern = validPatterns.some(pattern => pattern.test(content));
  if (!hasValidPattern) {
    return { valid: false, reason: 'File does not appear to be a valid kifu file' };
  }
  
  return { valid: true };
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Sanitize filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path separators and null bytes
  return filename
    .replace(/[\/\\]/g, '_')
    .replace(/\0/g, '')
    .replace(/\.{2,}/g, '_')
    .slice(0, 255);
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; reason?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSizeMB = 2; // Reduced for security
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, reason: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' };
  }
  
  if (!validateFileSize(file, maxSizeMB)) {
    return { valid: false, reason: `File too large. Maximum size is ${maxSizeMB}MB.` };
  }
  
  return { valid: true };
}