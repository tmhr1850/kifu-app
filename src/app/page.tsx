import { DraggableBoard } from '@/components/shogi/DraggableBoard'
import { Position } from '@/utils/shogi/moveRules'

export default function Home() {
  const handleMove = (from: Position, to: Position) => {
    console.log(`Moved piece from (${from.row + 1}, ${9 - from.col}) to (${to.row + 1}, ${9 - to.col})`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      <main className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-amber-900">
          将棋盤
        </h1>
        <DraggableBoard onMove={handleMove} />
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>駒をドラッグ&ドロップまたはタップで移動できます</p>
          <p>ESCキーで選択をキャンセルできます</p>
        </div>
      </main>
    </div>
  )
}