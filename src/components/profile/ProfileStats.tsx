'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Trophy, Target, Percent, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ProfileStats as ProfileStatsType } from '@/types/profile'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
)

interface ProfileStatsProps {
  userId: string
}

interface OpeningStats {
  opening_name: string
  count: number
  wins: number
}

export function ProfileStats({ userId }: ProfileStatsProps) {
  const [stats, setStats] = useState<ProfileStatsType | null>(null)
  const [openingStats, setOpeningStats] = useState<OpeningStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 基本統計を取得（kifusテーブルから集計）
        const { data: kifus, error: kifusError } = await supabase
          .from('kifus')
          .select('result, opening_name')
          .eq('user_id', userId)

        if (kifusError) throw kifusError

        if (kifus) {
          // 基本統計を計算
          const totalGames = kifus.length
          const wins = kifus.filter(k => k.result === 'win').length
          const losses = kifus.filter(k => k.result === 'loss').length
          const draws = kifus.filter(k => k.result === 'draw').length
          const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0

          setStats({
            total_games: totalGames,
            wins,
            losses,
            draws,
            win_rate: winRate,
          })

          // 戦型別統計を計算
          const openingMap = new Map<string, { count: number; wins: number }>()
          
          kifus.forEach(kifu => {
            if (kifu.opening_name) {
              const existing = openingMap.get(kifu.opening_name) || { count: 0, wins: 0 }
              existing.count++
              if (kifu.result === 'win') existing.wins++
              openingMap.set(kifu.opening_name, existing)
            }
          })

          const openingData = Array.from(openingMap.entries())
            .map(([opening_name, data]) => ({
              opening_name,
              count: data.count,
              wins: data.wins,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5) // 上位5つの戦型

          setOpeningStats(openingData)
        }
      } catch (error) {
        console.error('統計の取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [userId])

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

  // グラフデータ
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

  const openingChartData = {
    labels: openingStats.map(o => o.opening_name),
    datasets: [
      {
        label: '対局数',
        data: openingStats.map(o => o.count),
        backgroundColor: '#3b82f6',
      },
      {
        label: '勝利数',
        data: openingStats.map(o => o.wins),
        backgroundColor: '#10b981',
      },
    ],
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>対局統計</CardTitle>
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

            {openingStats.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">戦型別統計</h3>
                <Bar
                  data={openingChartData}
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
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                        },
                      },
                    },
                  }}
                  height={200}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}