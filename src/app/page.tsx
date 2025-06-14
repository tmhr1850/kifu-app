import { GameBoard } from '@/components/shogi/GameBoard'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      <main className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-amber-900">
            将棋対局
          </h1>
          <Link 
            href="/kifu" 
            className="px-4 py-2 bg-white text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
          >
            保存済み棋譜一覧
          </Link>
        </div>
        <GameBoard />
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>駒をドラッグ&ドロップまたはタップで移動できます</p>
          <p>ESCキーで選択をキャンセルできます</p>
        </div>
      </main>
    </div>
  )
}