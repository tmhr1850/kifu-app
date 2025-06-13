import { Board } from '@/components/shogi/Board'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      <main className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-amber-900">
          将棋盤
        </h1>
        <Board />
      </main>
    </div>
  )
}