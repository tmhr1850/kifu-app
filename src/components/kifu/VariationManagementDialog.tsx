'use client'

import React, { useState } from 'react'
import { VariationNode } from '@/types/kifu'
import { X, Edit2, ArrowUp, Trash2 } from 'lucide-react'

interface VariationManagementDialogProps {
  isOpen: boolean
  onClose: () => void
  node: VariationNode | null
  onRename: (nodeId: string, name: string) => void
  onPromoteToMainLine: (nodeId: string) => void
  onDelete: (nodeId: string) => void
}

export default function VariationManagementDialog({
  isOpen,
  onClose,
  node,
  onRename,
  onPromoteToMainLine,
  onDelete
}: VariationManagementDialogProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!isOpen || !node) return null

  const handleRename = () => {
    if (newName.trim()) {
      onRename(node.id, newName.trim())
      setIsRenaming(false)
      setNewName('')
    }
  }

  const handleDelete = () => {
    onDelete(node.id)
    setShowDeleteConfirm(false)
    onClose()
  }

  const handlePromote = () => {
    onPromoteToMainLine(node.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">変化の管理</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {node.moveNumber}手目の変化
              {node.comment && (
                <span className="block mt-1 text-gray-500">
                  コメント: {node.comment}
                </span>
              )}
            </p>
          </div>

          <div className="space-y-3">
            {/* Rename variation */}
            <div className="border rounded-lg p-3">
              {isRenaming ? (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    変化名を入力
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="例: 攻めの変化"
                      className="flex-1 px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleRename()
                      }}
                    />
                    <button
                      onClick={handleRename}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setIsRenaming(false)
                        setNewName('')
                      }}
                      className="px-3 py-1 border rounded hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsRenaming(true)
                    setNewName(node.comment || '')
                  }}
                  className="flex items-center gap-2 w-full text-left hover:bg-gray-50 p-2 rounded"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                  <div>
                    <span className="font-medium">変化名を編集</span>
                    <span className="block text-sm text-gray-500">
                      この変化にわかりやすい名前を付けます
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* Promote to main line */}
            {!node.isMainLine && (
              <div className="border rounded-lg p-3">
                <button
                  onClick={handlePromote}
                  className="flex items-center gap-2 w-full text-left hover:bg-gray-50 p-2 rounded"
                >
                  <ArrowUp className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="font-medium text-blue-600">本譜に昇格</span>
                    <span className="block text-sm text-gray-500">
                      この変化を本譜として設定します
                    </span>
                  </div>
                </button>
              </div>
            )}

            {/* Delete variation */}
            <div className="border border-red-200 rounded-lg p-3">
              {showDeleteConfirm ? (
                <div>
                  <p className="text-sm text-red-600 mb-2">
                    本当にこの変化を削除しますか？
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      削除する
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1 border rounded hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 w-full text-left hover:bg-red-50 p-2 rounded"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <div>
                    <span className="font-medium text-red-600">変化を削除</span>
                    <span className="block text-sm text-gray-500">
                      この変化とその子手順をすべて削除します
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}