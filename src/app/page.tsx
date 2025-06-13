import ShogiBoard from '@/components/shogi/ShogiBoard';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto py-8">
        <ShogiBoard />
      </main>
    </div>
  );
}
