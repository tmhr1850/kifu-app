import {
  escapeHtml,
  validateUsername,
  validateProfileField,
  validateKifuContent,
  generateCSRFToken,
  validateCSRFToken,
  sanitizeFileName,
} from '../validation';

describe('Security Validation Utilities', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
      );
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
      expect(escapeHtml('"Hello" <world>')).toBe('&quot;Hello&quot; &lt;world&gt;');
      expect(escapeHtml("It's a test")).toBe('It&#x27;s a test');
      expect(escapeHtml('Normal text')).toBe('Normal text');
    });
  });

  describe('validateUsername', () => {
    it('should validate valid usernames', () => {
      const valid = ['abc123', 'user_name', 'test-user', '山田太郎', 'ユーザー123'];
      valid.forEach(username => {
        const result = validateUsername(username);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBe(username);
      });
    });

    it('should reject short usernames', () => {
      const result = validateUsername('ab');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('3文字以上');
    });

    it('should reject long usernames', () => {
      const result = validateUsername('a'.repeat(21));
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('20文字以内');
    });

    it('should reject usernames with invalid characters', () => {
      const invalid = ['user@name', 'user name', 'user!name', '<script>'];
      invalid.forEach(username => {
        const result = validateUsername(username);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('使用できない文字');
      });
    });

    it('should trim whitespace', () => {
      const result = validateUsername('  validuser  ');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('validuser');
    });
  });

  describe('validateProfileField', () => {
    it('should validate valid profile fields', () => {
      const result = validateProfileField('This is a valid bio', 200);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('This is a valid bio');
    });

    it('should reject fields exceeding max length', () => {
      const result = validateProfileField('a'.repeat(201), 200);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('200文字以内');
    });

    it('should remove script tags', () => {
      const result = validateProfileField(
        'Hello <script>alert("XSS")</script> World',
        200
      );
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Hello  World');
    });

    it('should remove iframe tags', () => {
      const result = validateProfileField(
        'Check <iframe src="evil.com"></iframe> this',
        200
      );
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Check  this');
    });

    it('should remove javascript: URLs', () => {
      const result = validateProfileField(
        'Click javascript:alert("XSS") here',
        200
      );
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Click  here');
    });

    it('should remove event handlers', () => {
      const result = validateProfileField(
        'Click onclick="alert()" here',
        200
      );
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Click  here');
    });
  });

  describe('validateKifuContent', () => {
    it('should validate valid KIF content', () => {
      const kifContent = `# KIF形式
手数----指手---------消費時間--
   1 ７六歩(77)   ( 0:01/00:00:01)`;
      const result = validateKifuContent(kifContent);
      expect(result.isValid).toBe(true);
    });

    it('should validate valid KI2 content', () => {
      const ki2Content = `# KI2形式
▲７六歩    △３四歩`;
      const result = validateKifuContent(ki2Content);
      expect(result.isValid).toBe(true);
    });

    it('should validate valid CSA content', () => {
      const csaContent = `V2.2
PI
+7776FU`;
      const result = validateKifuContent(csaContent);
      expect(result.isValid).toBe(true);
    });

    it('should reject content exceeding size limit', () => {
      const largeContent = 'a'.repeat(1024 * 1024 + 1);
      const result = validateKifuContent(largeContent);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('ファイルサイズが大きすぎます');
    });

    it('should reject content with script tags', () => {
      const result = validateKifuContent('<script>alert("XSS")</script>');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('無効なコンテンツ');
    });

    it('should reject content without valid kifu patterns', () => {
      const result = validateKifuContent('This is just plain text');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('有効な棋譜形式ではありません');
    });
  });

  describe('CSRF Token Functions', () => {
    it('should generate valid CSRF tokens', () => {
      const token = generateCSRFToken();
      expect(token).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });

    it('should validate matching tokens', () => {
      const token = generateCSRFToken();
      expect(validateCSRFToken(token, token)).toBe(true);
    });

    it('should reject mismatched tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(validateCSRFToken(token1, token2)).toBe(false);
    });

    it('should reject invalid token format', () => {
      expect(validateCSRFToken('invalid', 'invalid')).toBe(false);
      expect(validateCSRFToken('', '')).toBe(false);
    });
  });

  describe('sanitizeFileName', () => {
    it('should sanitize file names with path separators', () => {
      expect(sanitizeFileName('../../etc/passwd')).toBe('_.._etc_passwd');
      expect(sanitizeFileName('C:\\Windows\\System32')).toBe('C:_Windows_System32');
    });

    it('should remove null bytes', () => {
      expect(sanitizeFileName('file\0name.txt')).toBe('filename.txt');
    });

    it('should replace special characters', () => {
      expect(sanitizeFileName('file<>:"|?*name.txt')).toBe('file________name.txt');
    });

    it('should trim whitespace', () => {
      expect(sanitizeFileName('  filename.txt  ')).toBe('filename.txt');
    });

    it('should handle Japanese characters', () => {
      expect(sanitizeFileName('棋譜ファイル.kif')).toBe('棋譜ファイル.kif');
    });
  });
});