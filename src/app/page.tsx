import { Board } from '@/components/shogi';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 py-8">
      <main className="container mx-auto px-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-amber-900 mb-8">
          ⚔️ 将棋アプリ ⚔️
        </h1>
        <Board />
      </main>
    </div>
  );
}
