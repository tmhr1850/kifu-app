// This file is deprecated. Import from storageService.ts instead
export * from './storageService';

// Re-export for backward compatibility
export {
  savePausedGame,
  loadPausedGame,
  deletePausedGame as removePausedGame
} from './storageService';

export type { PausedGame as PausedGameData } from './storageService';