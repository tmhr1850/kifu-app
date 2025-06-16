'use client';

import React, { useState, useEffect } from 'react';
import { KifuMetadata } from '@/types/kifu';
import { listKifuRecords, deleteKifuRecord } from '@/utils/shogi/storageService';
import { KifuCard } from '@/components/kifu/KifuCard';
import { ConfirmDialog } from '@/components/kifu/ConfirmDialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function KifuListPage() {
  const router = useRouter();
  const [kifuList, setKifuList] = useState<KifuMetadata[]>([]);
  const [filteredList, setFilteredList] = useState<KifuMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'player'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    loadKifuList();
  }, []);

  useEffect(() => {
    filterAndSortList();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kifuList, searchTerm, sortBy, sortOrder, dateFrom, dateTo]);

  const loadKifuList = () => {
    setLoading(true);
    try {
      const records = listKifuRecords();
      setKifuList(records);
    } catch (error) {
      console.error('Failed to load kifu list:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortList = () => {
    let filtered = [...kifuList];

    // 検索フィルター
    if (searchTerm) {
      filtered = filtered.filter(kifu => 
        kifu.gameInfo.sente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kifu.gameInfo.gote.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 日付フィルター
    if (dateFrom) {
      filtered = filtered.filter(kifu => kifu.gameInfo.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(kifu => kifu.gameInfo.date <= dateTo);
    }

    // ソート
    filtered.sort((a, b) => {
      let compareValue = 0;
      if (sortBy === 'date') {
        compareValue = new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
      } else {
        compareValue = a.gameInfo.sente.localeCompare(b.gameInfo.sente);
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    setFilteredList(filtered);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      if (deleteKifuRecord(deleteTarget)) {
        loadKifuList();
      }
      setDeleteTarget(null);
    }
  };

  const handleSelectKifu = (kifuId: string) => {
    router.push(`/?kifuId=${kifuId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">保存済み棋譜一覧</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            ← 対局画面に戻る
          </Link>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                対局者検索
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="対局者名を入力"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始日
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了日
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                並び替え
              </label>
              <div className="flex space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'player')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">日付</option>
                  <option value="player">対局者</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 棋譜一覧 */}
        {filteredList.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm text-center">
            <p className="text-gray-500 text-lg">
              {searchTerm || dateFrom || dateTo ? '条件に一致する棋譜がありません' : '保存された棋譜がありません'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredList.map((kifu) => (
              <KifuCard
                key={kifu.id}
                kifu={kifu}
                onSelect={() => handleSelectKifu(kifu.id)}
                onDelete={() => setDeleteTarget(kifu.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="棋譜を削除しますか？"
        message="この操作は取り消せません。"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        confirmText="削除"
        cancelText="キャンセル"
      />
    </div>
    </ProtectedRoute>
  );
}

