import {
  escapeHtml,
  sanitizeUsername,
  sanitizeProfileText,
  validateFileSize,
  validateFileExtension,
  validateKifuContent,
  generateCSRFToken,
  sanitizeFilename,
  validateImageFile
} from '../security';

describe('Security Utils', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
      expect(escapeHtml("Test's & \"quotes\"")).toBe("Test&#x27;s &amp; &quot;quotes&quot;");
      expect(escapeHtml('Normal text')).toBe('Normal text');
    });
  });

  describe('sanitizeUsername', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeUsername('<script>alert</script>user')).toBe('alertuser');
    });

    it('should allow alphanumeric and Japanese characters', () => {
      expect(sanitizeUsername('user123')).toBe('user123');
      expect(sanitizeUsername('ユーザー太郎')).toBe('ユーザー太郎');
      expect(sanitizeUsername('user_name-123')).toBe('user_name-123');
    });

    it('should remove special characters except allowed ones', () => {
      expect(sanitizeUsername('user@#$%')).toBe('user');
      expect(sanitizeUsername('user!@#$%^&*()')).toBe('user');
    });

    it('should limit length to 20 characters', () => {
      const longUsername = 'a'.repeat(30);
      expect(sanitizeUsername(longUsername)).toHaveLength(20);
    });
  });

  describe('sanitizeProfileText', () => {
    it('should remove HTML tags and escape special characters', () => {
      expect(sanitizeProfileText('<b>Bold</b> & "text"')).toBe('Bold &amp; &quot;text&quot;');
    });

    it('should limit length to 500 characters', () => {
      const longText = 'a'.repeat(600);
      expect(sanitizeProfileText(longText)).toHaveLength(500);
    });
  });

  describe('validateFileSize', () => {
    it('should validate file size correctly', () => {
      const file = new File(['content'], 'test.txt');
      Object.defineProperty(file, 'size', { value: 500 * 1024 }); // 500KB
      
      expect(validateFileSize(file, 1)).toBe(true);
      expect(validateFileSize(file, 0.4)).toBe(false);
    });
  });

  describe('validateFileExtension', () => {
    it('should validate file extensions correctly', () => {
      expect(validateFileExtension('file.txt', ['txt', 'md'])).toBe(true);
      expect(validateFileExtension('file.TXT', ['txt', 'md'])).toBe(true);
      expect(validateFileExtension('file.exe', ['txt', 'md'])).toBe(false);
      expect(validateFileExtension('noextension', ['txt'])).toBe(false);
    });
  });

  describe('validateKifuContent', () => {
    it('should detect malicious patterns', () => {
      expect(validateKifuContent('<script>alert("XSS")</script>')).toEqual({
        valid: false,
        reason: 'File contains potentially malicious content'
      });
      
      expect(validateKifuContent('onclick="alert()"')).toEqual({
        valid: false,
        reason: 'File contains potentially malicious content'
      });
    });

    it('should validate legitimate kifu content', () => {
      const kifContent = `#KIF version=2.0
先手：山田太郎
後手：田中花子
手数----指手---------消費時間--`;
      
      expect(validateKifuContent(kifContent)).toEqual({ valid: true });
    });

    it('should reject content without valid kifu patterns', () => {
      expect(validateKifuContent('Just some random text')).toEqual({
        valid: false,
        reason: 'File does not appear to be a valid kifu file'
      });
    });
  });

  describe('generateCSRFToken', () => {
    it('should generate a 64-character token', () => {
      const token = generateCSRFToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove path separators', () => {
      expect(sanitizeFilename('../../etc/passwd')).toBe('__etcpasswd');
      expect(sanitizeFilename('folder\\file.txt')).toBe('folder_file.txt');
    });

    it('should remove null bytes', () => {
      expect(sanitizeFilename('file.txt\0.exe')).toBe('file.txt.exe');
    });

    it('should replace multiple dots', () => {
      expect(sanitizeFilename('file...txt')).toBe('file_txt');
    });

    it('should limit length to 255 characters', () => {
      const longFilename = 'a'.repeat(300) + '.txt';
      expect(sanitizeFilename(longFilename)).toHaveLength(255);
    });
  });

  describe('validateImageFile', () => {
    it('should validate allowed image types', () => {
      const jpegFile = new File([''], 'image.jpg', { type: 'image/jpeg' });
      expect(validateImageFile(jpegFile)).toEqual({ valid: true });
      
      const pngFile = new File([''], 'image.png', { type: 'image/png' });
      expect(validateImageFile(pngFile)).toEqual({ valid: true });
    });

    it('should reject disallowed file types', () => {
      const gifFile = new File([''], 'image.gif', { type: 'image/gif' });
      expect(validateImageFile(gifFile)).toEqual({
        valid: false,
        reason: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
      });
    });

    it('should reject large files', () => {
      const largeFile = new File([''], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 3 * 1024 * 1024 }); // 3MB
      
      expect(validateImageFile(largeFile)).toEqual({
        valid: false,
        reason: 'File too large. Maximum size is 2MB.'
      });
    });
  });
});