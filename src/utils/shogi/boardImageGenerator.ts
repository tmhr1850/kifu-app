import { Board, PieceType, Player } from '@/types/shogi';

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
  [PieceType.FU]: '歩',
  [PieceType.KYO]: '香',
  [PieceType.KEI]: '桂',
  [PieceType.GIN]: '銀',
  [PieceType.KIN]: '金',
  [PieceType.KAKU]: '角',
  [PieceType.HI]: '飛',
  [PieceType.OU]: '王',
  [PieceType.TO]: 'と',
  [PieceType.NKYO]: '杏',
  [PieceType.NKEI]: '圭',
  [PieceType.NGIN]: '全',
  [PieceType.UMA]: '馬',
  [PieceType.RYU]: '龍'
};

export function generateBoardImage(
  board: Board,
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
  
  // Draw pieces
  ctx.font = `${opts.fontSize}px ${opts.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece) {
        const x = startX + col * cellSize + cellSize / 2;
        const y = startY + row * cellSize + cellSize / 2;
        
        // Draw piece background
        ctx.fillStyle = piece.player === Player.SENTE ? '#ffffff' : '#cccccc';
        ctx.beginPath();
        ctx.arc(x, y, cellSize * 0.4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw piece text
        ctx.fillStyle = '#000000';
        const text = pieceKanji[piece.type] || piece.type;
        
        // For gote pieces, draw upside down
        if (piece.player === Player.GOTE) {
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
  
  return canvas;
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