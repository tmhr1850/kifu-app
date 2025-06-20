/* eslint-disable @typescript-eslint/no-unused-vars */
import { createClient } from "@/lib/supabase";

export interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

export interface OpeningStatistics {
  opening: string;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}

export interface TimeBasedStatistics {
  hour: number;
  totalGames: number;
  wins: number;
  winRate: number;
}

export interface OpponentStatistics {
  opponentId: string;
  opponentName: string;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  lastPlayed: string;
}

export interface PerformanceTrend {
  date: string;
  winRate: number;
  gamesPlayed: number;
}

export interface DetailedStatistics {
  openingStats: OpeningStatistics[];
  timeBasedStats: TimeBasedStatistics[];
  opponentStats: OpponentStatistics[];
  performanceTrend: PerformanceTrend[];
  streaks: {
    currentWinStreak: number;
    currentLoseStreak: number;
    longestWinStreak: number;
    longestLoseStreak: number;
  };
}

export const getTimeRanges = (): Record<string, TimeRange> => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return {
    week: {
      start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      end: now,
      label: "過去1週間"
    },
    month: {
      start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      end: now,
      label: "過去1ヶ月"
    },
    year: {
      start: new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000),
      end: now,
      label: "過去1年"
    },
    all: {
      start: new Date(2000, 0, 1),
      end: now,
      label: "全期間"
    }
  };
};

export const fetchDetailedStatistics = async (
  userId: string,
  timeRange: TimeRange
): Promise<DetailedStatistics> => {
  // Fetch opening statistics
  const openingStats = await fetchOpeningStatistics(userId, timeRange);
  
  // Fetch time-based statistics
  const timeBasedStats = await fetchTimeBasedStatistics(userId, timeRange);
  
  // Fetch opponent statistics
  const opponentStats = await fetchOpponentStatistics(userId, timeRange);
  
  // Fetch performance trend
  const performanceTrend = await fetchPerformanceTrend(userId, timeRange);
  
  // Calculate streaks
  const streaks = await calculateStreaks(userId);
  
  return {
    openingStats,
    timeBasedStats,
    opponentStats,
    performanceTrend,
    streaks
  };
};

const fetchOpeningStatistics = async (
  userId: string,
  timeRange: TimeRange
): Promise<OpeningStatistics[]> => {
  // TODO: Implement proper Supabase client once environment variables are configured
  return [];
  
  // const supabase = createClient();
  
  // const { data: games, error } = await supabase
  //   .from('kifu')
  //   .select('opening, result')
  //   .or(`black_player_id.eq.${userId},white_player_id.eq.${userId}`)
  //   .gte('created_at', timeRange.start.toISOString())
  //   .lte('created_at', timeRange.end.toISOString())
  //   .eq('is_public', true);
    
  // if (error || !games) return [];
  
  // const openingMap = new Map<string, OpeningStatistics>();
  
  // games.forEach(game => {
  //   if (!game.opening) return;
    
  //   const stats = openingMap.get(game.opening) || {
  //     opening: game.opening,
  //     totalGames: 0,
  //     wins: 0,
  //     losses: 0,
  //     draws: 0,
  //     winRate: 0
  //   };
    
  //   stats.totalGames++;
    
  //   if (game.result === 'win') stats.wins++;
  //   else if (game.result === 'lose') stats.losses++;
  //   else if (game.result === 'draw') stats.draws++;
    
  //   openingMap.set(game.opening, stats);
  // });
  
  // // Calculate win rates
  // const openingStats = Array.from(openingMap.values()).map(stats => ({
  //   ...stats,
  //   winRate: stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0
  // }));
  
  // return openingStats.sort((a, b) => b.totalGames - a.totalGames);
};

const fetchTimeBasedStatistics = async (
  userId: string,
  timeRange: TimeRange
): Promise<TimeBasedStatistics[]> => {
  // TODO: Implement proper Supabase client once environment variables are configured
  return [];
};

const fetchOpponentStatistics = async (
  userId: string,
  timeRange: TimeRange
): Promise<OpponentStatistics[]> => {
  // TODO: Implement proper Supabase client once environment variables are configured
  return [];
};

const fetchPerformanceTrend = async (
  userId: string,
  timeRange: TimeRange
): Promise<PerformanceTrend[]> => {
  // TODO: Implement proper Supabase client once environment variables are configured
  return [];
};

const calculateStreaks = async (userId: string): Promise<{
  currentWinStreak: number;
  currentLoseStreak: number;
  longestWinStreak: number;
  longestLoseStreak: number;
}> => {
  // TODO: Implement proper Supabase client once environment variables are configured
  return {
    currentWinStreak: 0,
    currentLoseStreak: 0,
    longestWinStreak: 0,
    longestLoseStreak: 0
  };
};