'use client'

import React from 'react'
import { useSocket } from '@/contexts/SocketContext'

export function ConnectionStatus() {
  const { connectionStatus, reconnectAttempts, lastError, manualReconnect } = useSocket()

  const getStatusMessage = () => {
    switch (connectionStatus) {
      case 'connecting':
        return '接続中...'
      case 'connected':
        return '接続済み'
      case 'disconnected':
        return '切断済み'
      case 'reconnecting':
        return `再接続中... (試行回数: ${reconnectAttempts})`
      case 'error':
        return 'エラー'
      default:
        return ''
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
      case 'reconnecting':
        return 'bg-yellow-500'
      case 'disconnected':
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (connectionStatus === 'connected') {
    return null // 接続済みの場合は何も表示しない
  }

  return (
    <div className="fixed top-20 right-4 bg-white shadow-lg rounded-lg p-4 max-w-sm z-50">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
        <div className="flex-1">
          <p className="font-semibold text-sm">{getStatusMessage()}</p>
          {lastError && (
            <p className="text-xs text-gray-600 mt-1">{lastError}</p>
          )}
        </div>
      </div>
      {connectionStatus === 'error' && (
        <button
          onClick={manualReconnect}
          className="mt-3 w-full px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
        >
          再接続を試す
        </button>
      )}
    </div>
  )
}