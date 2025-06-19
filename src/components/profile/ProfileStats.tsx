'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Trophy, Target, Percent, TrendingUp, Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { ProfileStats as ProfileStatsType, ExtendedProfileStats, TimeRangePeriod } from '@/types/profile'
import { fetchDetailedStatistics, getTimeRanges } from '@/utils/statistics'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  RadialLinearScale,
} from 'chart.js'
import { Doughnut, Bar, Line } from 'react-chartjs-2'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  RadialLinearScale
)

interface ProfileStatsProps {
  userId: string
}

export function ProfileStats({ userId }: ProfileStatsProps) {
  const [stats, setStats] = useState<ProfileStatsType | null>(null)
  const [extendedStats, setExtendedStats] = useState<ExtendedProfileStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<TimeRangePeriod>('all')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        
        // 基本統計を取得
        const supabase = createClient()
        const { data: games, error: gamesError } = await supabase
          .from('kifu')
          .select('result, opening')
          .or(`black_player_id.eq.${userId},white_player_id.eq.${userId}`)
          .eq('is_public', true)

        if (gamesError) throw gamesError

        if (games) {
          const totalGames = games.length
          const wins = games.filter(g => g.result === 'win').length
          const losses = games.filter(g => g.result === 'lose').length
          const draws = games.filter(g => g.result === 'draw').length
          const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0

          setStats({
            total_games: totalGames,
            wins,
            losses,
            draws,
            win_rate: winRate,
          })

          // 詳細統計を取得
          const timeRange = getTimeRanges()[selectedPeriod]
          const detailedStats = await fetchDetailedStatistics(userId, timeRange)
          
          setExtendedStats({
            total_games: totalGames,
            wins,
            losses,
            draws,
            win_rate: winRate,
            ...detailedStats
          })
        }
      } catch (error) {
        console.error('統計の取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [userId, selectedPeriod])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          統計を読み込み中...
        </CardContent>
      </Card>
    )
  }

  if (!stats || stats.total_games === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          まだ対局記録がありません
        </CardContent>
      </Card>
    )
  }

  // 基本的なグラフデータ
  const resultChartData = {
    labels: ['勝ち', '負け', '引き分け'],
    datasets: [
      {
        data: [stats.wins, stats.losses, stats.draws],
        backgroundColor: ['#10b981', '#ef4444', '#6b7280'],
        borderWidth: 0,
      },
    ],
  }

  // 戦型別グラフデータ
  const openingChartData = extendedStats ? {
    labels: extendedStats.openingStats.slice(0, 10).map(o => o.opening),
    datasets: [
      {
        label: '勝率 (%)',
        data: extendedStats.openingStats.slice(0, 10).map(o => o.winRate),
        backgroundColor: '#3b82f6',
      },
    ],
  } : null

  // 時間帯別ヒートマップデータ
  const timeHeatmapData = extendedStats ? {
    labels: Array.from({ length: 24 }, (_, i) => `${i}時`),
    datasets: [
      {
        label: '対局数',
        data: extendedStats.timeBasedStats.map(t => t.totalGames),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: '勝率 (%)',
        data: extendedStats.timeBasedStats.map(t => t.winRate),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  } : null

  // パフォーマンストレンドデータ
  const performanceTrendData = extendedStats && extendedStats.performanceTrend.length > 0 ? {
    labels: extendedStats.performanceTrend.map(p => new Date(p.date).toLocaleDateString('ja-JP')),
    datasets: [
      {
        label: '勝率 (%)',
        data: extendedStats.performanceTrend.map(p => p.winRate),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
      },
    ],
  } : null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>対局統計</CardTitle>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as TimeRangePeriod)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="week">過去1週間</option>
              <option value="month">過去1ヶ月</option>
              <option value="year">過去1年</option>
              <option value="all">全期間</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-2xl font-bold">{stats.total_games}</p>
              <p className="text-sm text-gray-600">総対局数</p>
            </div>
            
            <div className="text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{stats.wins}</p>
              <p className="text-sm text-gray-600">勝利</p>
            </div>
            
            <div className="text-center">
              <Percent className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{stats.win_rate.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">勝率</p>
            </div>
            
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">{stats.losses}</p>
              <p className="text-sm text-gray-600">敗北</p>
            </div>
          </div>

          {extendedStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <Flame className="w-6 h-6 mx-auto mb-1 text-orange-600" />
                <p className="text-lg font-bold">{extendedStats.streaks.currentWinStreak}</p>
                <p className="text-xs text-gray-600">現在の連勝</p>
              </div>
              <div className="text-center">
                <Flame className="w-6 h-6 mx-auto mb-1 text-red-600" />
                <p className="text-lg font-bold">{extendedStats.streaks.currentLoseStreak}</p>
                <p className="text-xs text-gray-600">現在の連敗</p>
              </div>
              <div className="text-center">
                <Trophy className="w-6 h-6 mx-auto mb-1 text-yellow-600" />
                <p className="text-lg font-bold">{extendedStats.streaks.longestWinStreak}</p>
                <p className="text-xs text-gray-600">最長連勝</p>
              </div>
              <div className="text-center">
                <Target className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                <p className="text-lg font-bold">{extendedStats.streaks.longestLoseStreak}</p>
                <p className="text-xs text-gray-600">最長連敗</p>
              </div>
            </div>
          )}

          <Tabs defaultValue="overview" className="mt-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">概要</TabsTrigger>
              <TabsTrigger value="opening">戦型</TabsTrigger>
              <TabsTrigger value="time">時間帯</TabsTrigger>
              <TabsTrigger value="opponent">対戦相手</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">勝敗内訳</h3>
                  <div className="w-48 h-48 mx-auto">
                    <Doughnut 
                      data={resultChartData}
                      options={{
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                {performanceTrendData && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">パフォーマンストレンド</h3>
                    <Line
                      data={performanceTrendData}
                      options={{
                        maintainAspectRatio: false,
                        responsive: true,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                              callback: (value) => `${value}%`,
                            },
                          },
                        },
                      }}
                      height={200}
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="opening" className="mt-4">
              {openingChartData && extendedStats && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">戦型別勝率</h3>
                  <Bar
                    data={openingChartData}
                    options={{
                      maintainAspectRatio: false,
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            callback: (value) => `${value}%`,
                          },
                        },
                      },
                    }}
                    height={300}
                  />
                  
                  <div className="mt-4 space-y-2">
                    {extendedStats.openingStats.slice(0, 10).map((opening, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="font-medium">{opening.opening}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{opening.totalGames}局</span>
                          <span className="text-green-600">{opening.wins}勝</span>
                          <span className="text-red-600">{opening.losses}敗</span>
                          <span className="font-bold">{opening.winRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="time" className="mt-4">
              {timeHeatmapData && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">時間帯別成績</h3>
                  <Bar
                    data={timeHeatmapData}
                    options={{
                      maintainAspectRatio: false,
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                      },
                      scales: {
                        y: {
                          type: 'linear',
                          display: true,
                          position: 'left',
                          title: {
                            display: true,
                            text: '対局数',
                          },
                        },
                        y1: {
                          type: 'linear',
                          display: true,
                          position: 'right',
                          title: {
                            display: true,
                            text: '勝率 (%)',
                          },
                          grid: {
                            drawOnChartArea: false,
                          },
                          min: 0,
                          max: 100,
                        },
                      },
                    }}
                    height={300}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="opponent" className="mt-4">
              {extendedStats && extendedStats.opponentStats.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">対戦相手別成績</h3>
                  <div className="space-y-2">
                    {extendedStats.opponentStats.slice(0, 10).map((opponent, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{opponent.opponentName}</span>
                          <span className="text-sm text-gray-600">
                            {new Date(opponent.lastPlayed).toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <span>{opponent.totalGames}局</span>
                            <span className="text-green-600">{opponent.wins}勝</span>
                            <span className="text-red-600">{opponent.losses}敗</span>
                            {opponent.draws > 0 && (
                              <span className="text-gray-600">{opponent.draws}分</span>
                            )}
                          </div>
                          <span className="font-bold text-lg">
                            {opponent.winRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}