'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { loadKifuRecord } from '@/utils/shogi/storageService'
import KifuReplayBoardWithVariations from '@/components/kifu/KifuReplayBoardWithVariations'
import { KifuRecord } from '@/types/kifu'
import { ArrowLeft } from 'lucide-react'

export default function KifuReplayPage() {
  const params = useParams()
  const [kifu, setKifu] = useState<KifuRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const kifuId = params.id as string
    if (kifuId) {
      try {
        const loadedKifu = loadKifuRecord(kifuId)
        if (loadedKifu) {
          setKifu(loadedKifu)
        } else {
          setError('棋譜が見つかりません')
        }
      } catch {
        setError('棋譜の読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !kifu) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '棋譜が見つかりません'}</p>
          <Link
            href="/kifu"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            棋譜一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/kifu"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            棋譜一覧に戻る
          </Link>
        </div>

        <KifuReplayBoardWithVariations kifu={kifu} allowEditing={true} />
      </div>
    </div>
  )
}