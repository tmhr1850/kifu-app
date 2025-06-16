import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import type { MatchingOptions, MatchRequest, GameInvite, MatchFoundEvent, TimeControl } from '@/types/online'

export function useMatching() {
  const [isMatching, setIsMatching] = useState(false)
  const [matchRequest, setMatchRequest] = useState<MatchRequest | null>(null)
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const [pendingInvites, setPendingInvites] = useState<GameInvite[]>([])
  const [sentInvites, setSentInvites] = useState<GameInvite[]>([])
  
  const { socket } = useSocket()
  const { user } = useAuth()
  const router = useRouter()

  // マッチング開始
  const startMatching = useCallback((playerName: string, options: MatchingOptions) => {
    if (!socket || !user) return
    
    socket.emit('start_matching', {
      userId: user.id,
      playerName,
      options
    })
  }, [socket, user])

  // マッチングキャンセル
  const cancelMatching = useCallback(() => {
    if (!socket || !user) return
    
    socket.emit('cancel_matching', {
      userId: user.id
    })
    setIsMatching(false)
    setMatchRequest(null)
    setQueuePosition(null)
  }, [socket, user])

  // 招待送信
  const sendInvite = useCallback((toUserId: string, playerName: string, options?: {
    timeControl?: TimeControl
    message?: string
  }) => {
    if (!socket || !user) return
    
    socket.emit('send_invite', {
      fromUserId: user.id,
      fromUserName: playerName,
      toUserId,
      timeControl: options?.timeControl,
      message: options?.message
    })
  }, [socket, user])

  // 招待への返答
  const respondToInvite = useCallback((inviteId: string, accept: boolean, playerName?: string) => {
    if (!socket || !user) return
    
    socket.emit('respond_invite', {
      inviteId,
      accept,
      userId: user.id,
      playerName
    })
    
    // ローカルの招待リストから削除
    setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId))
  }, [socket, user])

  useEffect(() => {
    if (!socket) return

    // マッチング開始通知
    const handleMatchingStarted = (data: { requestId: string; queuePosition: number }) => {
      setIsMatching(true)
      setQueuePosition(data.queuePosition)
    }

    // マッチング成立通知
    const handleMatchFound = (data: MatchFoundEvent) => {
      setIsMatching(false)
      setMatchRequest(null)
      setQueuePosition(null)
      
      // 対局画面へ遷移
      router.push(`/online/room/${data.roomId}`)
    }

    // マッチングキャンセル通知
    const handleMatchingCancelled = () => {
      setIsMatching(false)
      setMatchRequest(null)
      setQueuePosition(null)
    }

    // 招待受信
    const handleInviteReceived = (invite: GameInvite) => {
      setPendingInvites(prev => [...prev, invite])
    }

    // 招待送信完了
    const handleInviteSent = () => {
      // 送信済みリストに追加する処理など
    }

    // 招待承諾
    const handleInviteAccepted = (data: { inviteId: string; roomId: string; playerColor: string }) => {
      setSentInvites(prev => prev.filter(inv => inv.id !== data.inviteId))
      router.push(`/online/room/${data.roomId}`)
    }

    // 招待拒否
    const handleInviteDeclined = (data: { inviteId: string }) => {
      setSentInvites(prev => prev.filter(inv => inv.id !== data.inviteId))
    }

    // 招待期限切れ
    const handleInviteExpired = (data: { inviteId: string }) => {
      setPendingInvites(prev => prev.filter(inv => inv.id !== data.inviteId))
      setSentInvites(prev => prev.filter(inv => inv.id !== data.inviteId))
    }

    // エラー処理
    const handleError = (data: { message: string }) => {
      alert(data.message)
      setIsMatching(false)
    }

    socket.on('matching_started', handleMatchingStarted)
    socket.on('match_found', handleMatchFound)
    socket.on('matching_cancelled', handleMatchingCancelled)
    socket.on('invite_received', handleInviteReceived)
    socket.on('invite_sent', handleInviteSent)
    socket.on('invite_accepted', handleInviteAccepted)
    socket.on('invite_declined', handleInviteDeclined)
    socket.on('invite_expired', handleInviteExpired)
    socket.on('error', handleError)

    return () => {
      socket.off('matching_started', handleMatchingStarted)
      socket.off('match_found', handleMatchFound)
      socket.off('matching_cancelled', handleMatchingCancelled)
      socket.off('invite_received', handleInviteReceived)
      socket.off('invite_sent', handleInviteSent)
      socket.off('invite_accepted', handleInviteAccepted)
      socket.off('invite_declined', handleInviteDeclined)
      socket.off('invite_expired', handleInviteExpired)
      socket.off('error', handleError)
    }
  }, [socket, router])

  return {
    isMatching,
    matchRequest,
    queuePosition,
    pendingInvites,
    sentInvites,
    startMatching,
    cancelMatching,
    sendInvite,
    respondToInvite
  }
}