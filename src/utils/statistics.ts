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
  const supabase = createClient();
  
  const { data: games, error } = await supabase
    .from('kifu')
    .select('opening, result')
    .or(`black_player_id.eq.${userId},white_player_id.eq.${userId}`)
    .gte('created_at', timeRange.start.toISOString())
    .lte('created_at', timeRange.end.toISOString())
    .eq('is_public', true);
    
  if (error || !games) return [];
  
  const openingMap = new Map<string, OpeningStatistics>();
  
  games.forEach(game => {
    if (!game.opening) return;
    
    const stats = openingMap.get(game.opening) || {
      opening: game.opening,
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0
    };
    
    stats.totalGames++;
    
    if (game.result === 'win') stats.wins++;
    else if (game.result === 'lose') stats.losses++;
    else if (game.result === 'draw') stats.draws++;
    
    openingMap.set(game.opening, stats);
  });
  
  // Calculate win rates
  const openingStats = Array.from(openingMap.values()).map(stats => ({
    ...stats,
    winRate: stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0
  }));
  
  return openingStats.sort((a, b) => b.totalGames - a.totalGames);
};

const fetchTimeBasedStatistics = async (
  userId: string,
  timeRange: TimeRange
): Promise<TimeBasedStatistics[]> => {
  const supabase = createClient();
  
  const { data: games, error } = await supabase
    .from('kifu')
    .select('created_at, result')
    .or(`black_player_id.eq.${userId},white_player_id.eq.${userId}`)
    .gte('created_at', timeRange.start.toISOString())
    .lte('created_at', timeRange.end.toISOString())
    .eq('is_public', true);
    
  if (error || !games) return [];
  
  const hourMap = new Map<number, TimeBasedStatistics>();
  
  // Initialize all hours
  for (let hour = 0; hour < 24; hour++) {
    hourMap.set(hour, {
      hour,
      totalGames: 0,
      wins: 0,
      winRate: 0
    });
  }
  
  games.forEach(game => {
    const hour = new Date(game.created_at).getHours();
    const stats = hourMap.get(hour)!;
    
    stats.totalGames++;
    if (game.result === 'win') stats.wins++;
  });
  
  // Calculate win rates
  const timeBasedStats = Array.from(hourMap.values()).map(stats => ({
    ...stats,
    winRate: stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0
  }));
  
  return timeBasedStats;
};

const fetchOpponentStatistics = async (
  userId: string,
  timeRange: TimeRange
): Promise<OpponentStatistics[]> => {
  const supabase = createClient();
  
  const { data: games, error } = await supabase
    .from('kifu')
    .select(`
      black_player_id,
      white_player_id,
      result,
      created_at,
      black_player:profiles!kifu_black_player_id_fkey(id, display_name),
      white_player:profiles!kifu_white_player_id_fkey(id, display_name)
    `)
    .or(`black_player_id.eq.${userId},white_player_id.eq.${userId}`)
    .gte('created_at', timeRange.start.toISOString())
    .lte('created_at', timeRange.end.toISOString())
    .eq('is_public', true);
    
  if (error || !games) return [];
  
  const opponentMap = new Map<string, OpponentStatistics>();
  
  games.forEach(game => {
    const isBlack = game.black_player_id === userId;
    const opponentId = isBlack ? game.white_player_id : game.black_player_id;
    const opponentData = isBlack ? game.white_player : game.black_player;
    
    if (!opponentId || !opponentData) return;
    
    const stats = opponentMap.get(opponentId) || {
      opponentId,
      opponentName: opponentData.display_name || '名無し',
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      lastPlayed: game.created_at
    };
    
    stats.totalGames++;
    
    if (game.result === 'win') stats.wins++;
    else if (game.result === 'lose') stats.losses++;
    else if (game.result === 'draw') stats.draws++;
    
    // Update last played date
    if (new Date(game.created_at) > new Date(stats.lastPlayed)) {
      stats.lastPlayed = game.created_at;
    }
    
    opponentMap.set(opponentId, stats);
  });
  
  // Calculate win rates
  const opponentStats = Array.from(opponentMap.values()).map(stats => ({
    ...stats,
    winRate: stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0
  }));
  
  return opponentStats.sort((a, b) => b.totalGames - a.totalGames);
};

const fetchPerformanceTrend = async (
  userId: string,
  timeRange: TimeRange
): Promise<PerformanceTrend[]> => {
  const supabase = createClient();
  
  const { data: games, error } = await supabase
    .from('kifu')
    .select('created_at, result')
    .or(`black_player_id.eq.${userId},white_player_id.eq.${userId}`)
    .gte('created_at', timeRange.start.toISOString())
    .lte('created_at', timeRange.end.toISOString())
    .eq('is_public', true)
    .order('created_at', { ascending: true });
    
  if (error || !games) return [];
  
  // Group games by date
  const dateMap = new Map<string, { wins: number; total: number }>();
  
  games.forEach(game => {
    const date = new Date(game.created_at).toISOString().split('T')[0];
    const stats = dateMap.get(date) || { wins: 0, total: 0 };
    
    stats.total++;
    if (game.result === 'win') stats.wins++;
    
    dateMap.set(date, stats);
  });
  
  // Calculate cumulative win rate
  let cumulativeWins = 0;
  let cumulativeTotal = 0;
  
  const performanceTrend: PerformanceTrend[] = [];
  
  Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, stats]) => {
      cumulativeWins += stats.wins;
      cumulativeTotal += stats.total;
      
      performanceTrend.push({
        date,
        winRate: (cumulativeWins / cumulativeTotal) * 100,
        gamesPlayed: stats.total
      });
    });
  
  return performanceTrend;
};

const calculateStreaks = async (userId: string): Promise<{
  currentWinStreak: number;
  currentLoseStreak: number;
  longestWinStreak: number;
  longestLoseStreak: number;
}> => {
  const supabase = createClient();
  
  const { data: games, error } = await supabase
    .from('kifu')
    .select('result, created_at')
    .or(`black_player_id.eq.${userId},white_player_id.eq.${userId}`)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(100);
    
  if (error || !games) {
    return {
      currentWinStreak: 0,
      currentLoseStreak: 0,
      longestWinStreak: 0,
      longestLoseStreak: 0
    };
  }
  
  let currentWinStreak = 0;
  let currentLoseStreak = 0;
  let longestWinStreak = 0;
  let longestLoseStreak = 0;
  let tempWinStreak = 0;
  let tempLoseStreak = 0;
  
  // Process games from most recent to oldest
  for (let i = 0; i < games.length; i++) {
    const result = games[i].result;
    
    if (result === 'win') {
      tempWinStreak++;
      tempLoseStreak = 0;
      
      if (i === 0) currentWinStreak = tempWinStreak;
      longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
    } else if (result === 'lose') {
      tempLoseStreak++;
      tempWinStreak = 0;
      
      if (i === 0) currentLoseStreak = tempLoseStreak;
      longestLoseStreak = Math.max(longestLoseStreak, tempLoseStreak);
    } else {
      // Draw breaks both streaks
      if (i === 0) {
        currentWinStreak = 0;
        currentLoseStreak = 0;
      }
      tempWinStreak = 0;
      tempLoseStreak = 0;
    }
  }
  
  return {
    currentWinStreak,
    currentLoseStreak,
    longestWinStreak,
    longestLoseStreak
  };
};