import { BoardState, PieceType } from '@/types/shogi';

export interface ImageGeneratorOptions {
  width: number;
  height: number;
  backgroundColor?: string;
  lineColor?: string;
  lineWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  showCoordinates?: boolean;
}

const defaultOptions: ImageGeneratorOptions = {
  width: 600,
  height: 660,
  backgroundColor: '#f5deb3',
  lineColor: '#000000',
  lineWidth: 1,
  fontSize: 24,
  fontFamily: 'sans-serif',
  showCoordinates: true
};

const pieceKanji: { [key in PieceType]: string } = {
  '歩': '歩',
  '香': '香',
  '桂': '桂',
  '銀': '銀',
  '金': '金',
  '角': '角',
  '飛': '飛',
  '玉': '玉',
  '王': '王',
  'と': 'と',
  '成香': '杏',
  '成桂': '圭',
  '成銀': '全',
  '馬': '馬',
  '龍': '龍',
  '竜': '竜'
};

export function generateBoardImage(
  boardState: BoardState,
  options: Partial<ImageGeneratorOptions> = {}
): HTMLCanvasElement {
  const opts = { ...defaultOptions, ...options };
  const canvas = document.createElement('canvas');
  canvas.width = opts.width;
  canvas.height = opts.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Clear background
  ctx.fillStyle = opts.backgroundColor!;
  ctx.fillRect(0, 0, opts.width, opts.height);
  
  // Calculate board dimensions
  const margin = opts.showCoordinates ? 40 : 20;
  const boardSize = Math.min(opts.width, opts.height) - 2 * margin;
  const cellSize = boardSize / 9;
  const startX = (opts.width - boardSize) / 2;
  const startY = (opts.height - boardSize) / 2;
  
  // Draw grid
  ctx.strokeStyle = opts.lineColor!;
  ctx.lineWidth = opts.lineWidth!;
  
  for (let i = 0; i <= 9; i++) {
    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(startX + i * cellSize, startY);
    ctx.lineTo(startX + i * cellSize, startY + boardSize);
    ctx.stroke();
    
    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(startX, startY + i * cellSize);
    ctx.lineTo(startX + boardSize, startY + i * cellSize);
    ctx.stroke();
  }
  
  // Draw coordinates if enabled
  if (opts.showCoordinates) {
    ctx.font = `${opts.fontSize! * 0.6}px ${opts.fontFamily}`;
    ctx.fillStyle = opts.lineColor!;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const fileLabels = ['９', '８', '７', '６', '５', '４', '３', '２', '１'];
    const rankLabels = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
    
    for (let i = 0; i < 9; i++) {
      // File labels (top)
      ctx.fillText(
        fileLabels[i],
        startX + i * cellSize + cellSize / 2,
        startY - margin / 2
      );
      
      // Rank labels (right)
      ctx.fillText(
        rankLabels[i],
        startX + boardSize + margin / 2,
        startY + i * cellSize + cellSize / 2
      );
    }
  }
  
  // Draw pieces
  ctx.font = `${opts.fontSize}px ${opts.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = boardState.board[row][col];
      if (piece) {
        const x = startX + col * cellSize + cellSize / 2;
        const y = startY + row * cellSize + cellSize / 2;
        
        // Draw piece background (optional)
        ctx.fillStyle = piece.player === 'sente' ? '#ffffff' : '#cccccc';
        ctx.beginPath();
        ctx.arc(x, y, cellSize * 0.4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw piece text
        ctx.fillStyle = '#000000';
        const text = pieceKanji[piece.type] || piece.type;
        
        // For gote pieces, draw upside down
        if (piece.player === 'gote') {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.PI);
          ctx.fillText(text, 0, 0);
          ctx.restore();
        } else {
          ctx.fillText(text, x, y);
        }
      }
    }
  }
  
  // Draw captured pieces
  ctx.font = `${opts.fontSize! * 0.8}px ${opts.fontFamily}`;
  
  // Sente captured pieces (bottom)
  if (boardState.captured.sente.length > 0) {
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.fillText(
      '先手持駒: ' + formatCapturedPieces(boardState.captured.sente),
      margin,
      opts.height - margin
    );
  }
  
  // Gote captured pieces (top)
  if (boardState.captured.gote.length > 0) {
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.fillText(
      '後手持駒: ' + formatCapturedPieces(boardState.captured.gote),
      margin,
      margin / 2
    );
  }
  
  return canvas;
}

function formatCapturedPieces(pieces: PieceType[]): string {
  const counts: { [key: string]: number } = {};
  pieces.forEach(piece => {
    counts[piece] = (counts[piece] || 0) + 1;
  });
  
  return Object.entries(counts)
    .map(([piece, count]) => count > 1 ? `${piece}${count}` : piece)
    .join(' ');
}

export function downloadBoardImage(
  canvas: HTMLCanvasElement,
  fileName: string,
  format: 'png' | 'jpeg' = 'png'
): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, `image/${format}`);
}