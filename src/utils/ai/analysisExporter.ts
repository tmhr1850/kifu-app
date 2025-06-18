import { EvaluationHistoryEntry, PositionAnalysis } from '@/types/analysis';
import { Move } from '@/types/shogi';

export interface AnalysisExportData {
  metadata: {
    exportDate: string;
    gameDate?: string;
    players?: {
      sente: string;
      gote: string;
    };
    analysisSettings?: {
      depth: number;
      multiPV: number;
    };
  };
  moves: ExportedMove[];
  summary: {
    totalMoves: number;
    senteBlunders: number;
    senteMistakes: number;
    senteGoodMoves: number;
    senteBrilliantMoves: number;
    goteBlunders: number;
    goteMistakes: number;
    goteGoodMoves: number;
    goteBrilliantMoves: number;
    averageEvaluation: number;
    maxEvaluation: number;
    minEvaluation: number;
  };
}

export interface ExportedMove {
  moveNumber: number;
  move: Move;
  evaluation: number;
  quality?: string;
  bestMove?: Move;
  alternativeMoves?: Move[];
  comment?: string;
}

export class AnalysisExporter {
  /**
   * 分析結果をJSON形式でエクスポート
   */
  static exportToJSON(
    evaluationHistory: EvaluationHistoryEntry[],
    analyses: Map<number, PositionAnalysis>,
    metadata?: Partial<AnalysisExportData['metadata']>
  ): string {
    const exportData = this.prepareExportData(evaluationHistory, analyses, metadata);
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 分析結果をCSV形式でエクスポート
   */
  static exportToCSV(
    evaluationHistory: EvaluationHistoryEntry[],
    analyses: Map<number, PositionAnalysis>
  ): string {
    const headers = [
      '手数',
      '指し手',
      '評価値',
      '品質',
      '最善手',
      '探索深度',
      'コメント'
    ];

    const rows = evaluationHistory.map(entry => {
      const analysis = analyses.get(entry.moveNumber);
      return [
        entry.moveNumber.toString(),
        this.formatMove(entry.move),
        entry.score.toFixed(0),
        entry.quality || 'normal',
        analysis?.bestMove ? this.formatMove(analysis.bestMove) : '',
        analysis?.depth?.toString() || '',
        ''
      ];
    });

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  /**
   * 分析結果をテキスト形式でエクスポート
   */
  static exportToText(
    evaluationHistory: EvaluationHistoryEntry[],
    analyses: Map<number, PositionAnalysis>,
    metadata?: Partial<AnalysisExportData['metadata']>
  ): string {
    const exportData = this.prepareExportData(evaluationHistory, analyses, metadata);
    let text = '=== 将棋局面分析レポート ===\n\n';

    // メタデータ
    text += `エクスポート日時: ${exportData.metadata.exportDate}\n`;
    if (exportData.metadata.players) {
      text += `先手: ${exportData.metadata.players.sente}\n`;
      text += `後手: ${exportData.metadata.players.gote}\n`;
    }
    text += '\n';

    // サマリー
    text += '=== 分析サマリー ===\n';
    text += `総手数: ${exportData.summary.totalMoves}\n`;
    text += `平均評価値: ${exportData.summary.averageEvaluation.toFixed(0)}\n`;
    text += '\n先手:\n';
    text += `  素晴らしい手: ${exportData.summary.senteBrilliantMoves}\n`;
    text += `  良い手: ${exportData.summary.senteGoodMoves}\n`;
    text += `  悪手: ${exportData.summary.senteMistakes}\n`;
    text += `  大悪手: ${exportData.summary.senteBlunders}\n`;
    text += '\n後手:\n';
    text += `  素晴らしい手: ${exportData.summary.goteBrilliantMoves}\n`;
    text += `  良い手: ${exportData.summary.goteGoodMoves}\n`;
    text += `  悪手: ${exportData.summary.goteMistakes}\n`;
    text += `  大悪手: ${exportData.summary.goteBlunders}\n`;
    text += '\n';

    // 手順と評価
    text += '=== 手順と評価 ===\n';
    exportData.moves.forEach(move => {
      text += `\n${move.moveNumber}手目: ${this.formatMove(move.move)}`;
      if (move.quality && move.quality !== 'normal') {
        text += ` [${this.getQualityLabel(move.quality)}]`;
      }
      text += `\n  評価値: ${move.evaluation > 0 ? '+' : ''}${move.evaluation}\n`;
      if (move.bestMove) {
        text += `  最善手: ${this.formatMove(move.bestMove)}\n`;
      }
    });

    return text;
  }

  /**
   * エクスポート用データを準備
   */
  private static prepareExportData(
    evaluationHistory: EvaluationHistoryEntry[],
    analyses: Map<number, PositionAnalysis>,
    metadata?: Partial<AnalysisExportData['metadata']>
  ): AnalysisExportData {
    const moves: ExportedMove[] = evaluationHistory.map(entry => {
      const analysis = analyses.get(entry.moveNumber);
      return {
        moveNumber: entry.moveNumber,
        move: entry.move,
        evaluation: entry.score,
        quality: entry.quality,
        bestMove: analysis?.bestMove || undefined,
        alternativeMoves: analysis?.alternativeMoves,
      };
    });

    // サマリー計算
    const summary = this.calculateSummary(evaluationHistory);

    return {
      metadata: {
        exportDate: new Date().toISOString(),
        ...metadata,
      },
      moves,
      summary,
    };
  }

  /**
   * サマリー情報を計算
   */
  private static calculateSummary(history: EvaluationHistoryEntry[]): AnalysisExportData['summary'] {
    let senteBlunders = 0, senteMistakes = 0, senteGoodMoves = 0, senteBrilliantMoves = 0;
    let goteBlunders = 0, goteMistakes = 0, goteGoodMoves = 0, goteBrilliantMoves = 0;
    let totalEval = 0, maxEval = -Infinity, minEval = Infinity;

    history.forEach((entry, index) => {
      const isSente = index % 2 === 0;
      
      if (entry.quality) {
        if (isSente) {
          switch (entry.quality) {
            case 'blunder': senteBlunders++; break;
            case 'mistake': senteMistakes++; break;
            case 'good': senteGoodMoves++; break;
            case 'brilliant': senteBrilliantMoves++; break;
          }
        } else {
          switch (entry.quality) {
            case 'blunder': goteBlunders++; break;
            case 'mistake': goteMistakes++; break;
            case 'good': goteGoodMoves++; break;
            case 'brilliant': goteBrilliantMoves++; break;
          }
        }
      }

      totalEval += entry.score;
      maxEval = Math.max(maxEval, entry.score);
      minEval = Math.min(minEval, entry.score);
    });

    return {
      totalMoves: history.length,
      senteBlunders,
      senteMistakes,
      senteGoodMoves,
      senteBrilliantMoves,
      goteBlunders,
      goteMistakes,
      goteGoodMoves,
      goteBrilliantMoves,
      averageEvaluation: history.length > 0 ? totalEval / history.length : 0,
      maxEvaluation: maxEval === -Infinity ? 0 : maxEval,
      minEvaluation: minEval === Infinity ? 0 : minEval,
    };
  }

  /**
   * 指し手を文字列形式にフォーマット
   */
  private static formatMove(move: Move): string {
    if (!move) return '';
    
    const files = ['９', '８', '７', '６', '５', '４', '３', '２', '１'];
    const ranks = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
    
    const toFile = files[move.to.col];
    const toRank = ranks[move.to.row];
    
    if (move.from.row === -1) {
      // 駒台から
      return `${move.piece}*${toFile}${toRank}`;
    } else {
      // 盤上から
      const fromFile = files[move.from.col];
      const fromRank = ranks[move.from.row];
      const promoted = move.isPromotion ? '成' : '';
      return `${fromFile}${fromRank}${move.piece}${promoted}${toFile}${toRank}`;
    }
  }

  /**
   * 品質ラベルを取得
   */
  private static getQualityLabel(quality: string): string {
    switch (quality) {
      case 'brilliant': return '素晴らしい手';
      case 'good': return '良い手';
      case 'mistake': return '悪手';
      case 'blunder': return '大悪手';
      default: return '通常';
    }
  }

  /**
   * ファイルとしてダウンロード
   */
  static downloadAsFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}