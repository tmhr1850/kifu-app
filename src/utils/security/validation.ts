// Security utilities for input validation and sanitization

// HTML escape function to prevent XSS
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

// Validate and sanitize username
export function validateUsername(username: string): { isValid: boolean; sanitized: string; error?: string } {
  // Remove leading/trailing whitespace
  const sanitized = username.trim();
  
  // Check length
  if (sanitized.length < 3) {
    return { isValid: false, sanitized, error: 'ユーザー名は3文字以上必要です' };
  }
  if (sanitized.length > 20) {
    return { isValid: false, sanitized, error: 'ユーザー名は20文字以内にしてください' };
  }
  
  // Allow only alphanumeric, Japanese characters, underscore, and hyphen
  const validPattern = /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF_-]+$/;
  if (!validPattern.test(sanitized)) {
    return { isValid: false, sanitized, error: '使用できない文字が含まれています' };
  }
  
  return { isValid: true, sanitized };
}

// Validate and sanitize profile fields
export function validateProfileField(field: string, maxLength: number): { isValid: boolean; sanitized: string; error?: string } {
  // Remove leading/trailing whitespace
  const sanitized = field.trim();
  
  // Check length
  if (sanitized.length > maxLength) {
    return { isValid: false, sanitized, error: `${maxLength}文字以内にしてください` };
  }
  
  // Remove any script tags or dangerous HTML
  const cleaned = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  return { isValid: true, sanitized: cleaned };
}

// Validate file content for kifu import
export function validateKifuContent(content: string): { isValid: boolean; error?: string } {
  // Check for maximum content length (1MB of text)
  if (content.length > 1024 * 1024) {
    return { isValid: false, error: 'ファイルサイズが大きすぎます' };
  }
  
  // Check for script tags or suspicious content
  const dangerousPatterns = [
    /<script/i,
    /<iframe/i,
    /javascript:/i,
    /<object/i,
    /<embed/i,
    /on\w+\s*=/i,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      return { isValid: false, error: '無効なコンテンツが含まれています' };
    }
  }
  
  // Check if content contains valid kifu patterns
  const kifuPatterns = [
    /^\s*#/m, // KIF/KI2 comment
    /^\s*\d+\s+[▲△]/m, // KIF move notation
    /^[A-Z]/m, // CSA notation
    /手数----指手/m, // KIF header
  ];
  
  const hasKifuPattern = kifuPatterns.some(pattern => pattern.test(content));
  if (!hasKifuPattern) {
    return { isValid: false, error: '有効な棋譜形式ではありません' };
  }
  
  return { isValid: true };
}

// Generate CSRF token
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Validate CSRF token
export function validateCSRFToken(token: string, storedToken: string): boolean {
  return token === storedToken && token.length === 64;
}

// Sanitize file name
export function sanitizeFileName(fileName: string): string {
  // Remove path separators and null bytes
  return fileName
    .replace(/[\/\\]/g, '_')
    .replace(/\0/g, '')
    .replace(/[<>:"|?*]/g, '_')
    .trim();
}

// Input length limits
export const INPUT_LIMITS = {
  username: { min: 3, max: 20 },
  fullName: { max: 50 },
  bio: { max: 200 },
  kifuTitle: { max: 100 },
  comment: { max: 500 },
} as const;