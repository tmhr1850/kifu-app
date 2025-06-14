import { describe, it, expect } from '@jest/globals';
import { detectKifuFormat, parseKifuFile } from '../kifuFormatDetector';

describe('Kifu Format Detector', () => {
  describe('detectKifuFormat', () => {
    it('should detect KIF format', () => {
      const kif = `# ---- Kifu for Windows ----
開始日時：2024/01/15 10:00:00
先手：先手太郎
後手：後手花子
手数----指手---------消費時間--
   1 ７六歩(77)   ( 0:15/00:00:15)
   2 ３四歩(33)   ( 0:10/00:00:10)`;
      
      expect(detectKifuFormat(kif)).toBe('kif');
    });

    it('should detect KI2 format', () => {
      const ki2 = `# KI2 Format
開始日時：2024/01/15 10:00:00
先手：先手太郎
後手：後手花子

☗７六歩
☖３四歩`;
      
      expect(detectKifuFormat(ki2)).toBe('ki2');
    });

    it('should detect CSA format', () => {
      const csa = `V2.2
N+先手太郎
N-後手花子
PI
+
+7776FU
-3334FU`;
      
      expect(detectKifuFormat(csa)).toBe('csa');
    });

    it('should return unknown for invalid format', () => {
      const invalid = `This is not a valid kifu format`;
      expect(detectKifuFormat(invalid)).toBe('unknown');
    });
  });

  describe('parseKifuFile', () => {
    it('should parse KIF format', () => {
      const kif = `# ---- Kifu for Windows ----
開始日時：2024/01/15 10:00:00
先手：先手太郎
後手：後手花子
手数----指手---------消費時間--
   1 ７六歩(77)   ( 0:15/00:00:15)`;
      
      const result = parseKifuFile(kif);
      expect(result.format).toBe('kif');
      expect(result.gameInfo.sente).toBe('先手太郎');
      expect(result.moves).toHaveLength(1);
    });

    it('should throw error for unknown format', () => {
      const invalid = `This is not a valid kifu format`;
      expect(() => parseKifuFile(invalid)).toThrow('Unknown kifu format');
    });
  });
});