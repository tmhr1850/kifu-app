'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { Calendar, Clock, Trophy, FileText } from 'lucide-react'
import Link from 'next/link'

interface GameHistoryProps {
  userId: string
}

interface GameRecord {
  id: string
  title: string
  date_played?: string
  created_at: string
  result?: 'win' | 'loss' | 'draw'
  opening_name?: string
  game_length?: number
  is_public: boolean
}

export function GameHistory({ userId }: GameHistoryProps) {
  const [games, setGames] = useState<GameRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const { data, error } = await supabase
          .from('kifus')
          .select('id, title, date_played, created_at, result, opening_name, game_length, is_public')
          .eq('user_id', userId)
          .eq('is_public', true)
          .order('date_played', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) throw error
        setGames(data || [])
      } catch (error) {
        console.error('対局履歴の取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [userId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
  }

  const getResultColor = (result?: string) => {
    switch (result) {
      case 'win': return 'text-green-600'
      case 'loss': return 'text-red-600'
      case 'draw': return 'text-gray-600'
      default: return 'text-gray-400'
    }
  }

  const getResultText = (result?: string) => {
    switch (result) {
      case 'win': return '勝ち'
      case 'loss': return '負け'
      case 'draw': return '引き分け'
      default: return '―'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          対局履歴を読み込み中...
        </CardContent>
      </Card>
    )
  }

  if (games.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          公開されている対局記録がありません
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近の対局</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/kifu/${game.id}/replay`}
              className="block p-4 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium mb-1">{game.title}</h3>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(game.date_played || game.created_at)}</span>
                    </div>
                    
                    {game.opening_name && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>{game.opening_name}</span>
                      </div>
                    )}
                    
                    {game.game_length && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{game.game_length}手</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className={`flex items-center gap-1 ${getResultColor(game.result)}`}>
                  <Trophy className="w-5 h-5" />
                  <span className="font-medium">{getResultText(game.result)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {games.length >= 20 && (
          <p className="text-center text-sm text-gray-500 mt-4">
            最新20件を表示しています
          </p>
        )}
      </CardContent>
    </Card>
  )
}