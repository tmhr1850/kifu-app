const rooms = new Map()
const playerSockets = new Map()
const matchingQueue = []
const gameInvites = new Map()

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id)

    // ルーム作成
    socket.on('create_room', (data) => {
      const { userId, playerName } = data
      const roomId = generateRoomId()
      
      const room = {
        id: roomId,
        players: [{
          id: userId,
          name: playerName,
          socketId: socket.id,
          color: 'sente'
        }],
        gameState: null,
        createdAt: new Date()
      }
      
      rooms.set(roomId, room)
      playerSockets.set(socket.id, { roomId, userId })
      
      socket.join(roomId)
      socket.emit('room_created', { roomId, room })
    })

    // ルーム参加
    socket.on('join_room', (data) => {
      const { roomId, userId, playerName } = data
      const room = rooms.get(roomId)
      
      if (!room) {
        socket.emit('error', { message: 'ルームが見つかりません' })
        return
      }
      
      if (room.players.length >= 2) {
        socket.emit('error', { message: 'ルームは満員です' })
        return
      }

      // 再接続チェック
      const existingPlayer = room.players.find(p => p.id === userId)
      if (existingPlayer) {
        existingPlayer.socketId = socket.id
        playerSockets.set(socket.id, { roomId, userId })
        socket.join(roomId)
        socket.emit('reconnected', { room })
        socket.to(roomId).emit('opponent_reconnected', { playerId: userId })
        return
      }
      
      // 新規参加
      room.players.push({
        id: userId,
        name: playerName,
        socketId: socket.id,
        color: 'gote'
      })
      
      playerSockets.set(socket.id, { roomId, userId })
      socket.join(roomId)
      
      // 両プレイヤーに通知
      io.to(roomId).emit('player_joined', { room })
      
      // ゲーム開始
      if (room.players.length === 2) {
        io.to(roomId).emit('game_start', { room })
      }
    })

    // 指し手送信
    socket.on('make_move', (data) => {
      const { roomId, move, gameState } = data
      const room = rooms.get(roomId)
      
      if (!room) {
        socket.emit('error', { message: 'ルームが見つかりません' })
        return
      }
      
      // ゲーム状態を更新
      room.gameState = gameState
      
      // 相手に指し手を送信
      socket.to(roomId).emit('move_made', { move, gameState })
    })

    // 時間同期
    socket.on('sync_time', (data) => {
      const { roomId, timeData } = data
      socket.to(roomId).emit('time_synced', { timeData })
    })

    // 投了
    socket.on('resign', (data) => {
      const { roomId, playerId } = data
      const room = rooms.get(roomId)
      
      if (!room) return
      
      io.to(roomId).emit('game_resigned', { resignedPlayerId: playerId })
    })

    // マッチング開始
    socket.on('start_matching', (data) => {
      const { userId, playerName, options } = data
      
      // 既存のリクエストをチェック
      const existingIndex = matchingQueue.findIndex(req => req.playerId === userId)
      if (existingIndex !== -1) {
        socket.emit('error', { message: '既にマッチング中です' })
        return
      }
      
      const matchRequest = {
        id: generateMatchId(),
        playerId: userId,
        playerName: playerName,
        socketId: socket.id,
        rating: options.rating,
        timeControl: options.timeControl,
        mode: options.mode || 'random',
        createdAt: new Date(),
        status: 'waiting'
      }
      
      // ランダムマッチングの場合
      if (options.mode === 'random') {
        // キューから相手を探す
        const matchIndex = matchingQueue.findIndex(req => 
          req.status === 'waiting' && 
          req.playerId !== userId &&
          isTimeControlCompatible(req.timeControl, options.timeControl)
        )
        
        if (matchIndex !== -1) {
          // マッチング成立
          const opponent = matchingQueue[matchIndex]
          matchingQueue.splice(matchIndex, 1)
          
          // ルームを作成
          const roomId = generateRoomId()
          const colors = Math.random() < 0.5 ? ['sente', 'gote'] : ['gote', 'sente']
          
          const room = {
            id: roomId,
            players: [
              {
                id: userId,
                name: playerName,
                socketId: socket.id,
                color: colors[0],
                connected: true,
                rating: options.rating
              },
              {
                id: opponent.playerId,
                name: opponent.playerName,
                socketId: opponent.socketId,
                color: colors[1],
                connected: true,
                rating: opponent.rating
              }
            ],
            gameState: null,
            timeControl: options.timeControl,
            createdAt: new Date()
          }
          
          rooms.set(roomId, room)
          playerSockets.set(socket.id, { roomId, userId })
          playerSockets.set(opponent.socketId, { roomId, userId: opponent.playerId })
          
          // 両プレイヤーをルームに参加させる
          socket.join(roomId)
          io.sockets.sockets.get(opponent.socketId)?.join(roomId)
          
          // マッチング成立を通知
          socket.emit('match_found', {
            matchId: matchRequest.id,
            roomId: roomId,
            opponent: {
              id: opponent.playerId,
              name: opponent.playerName,
              rating: opponent.rating
            },
            timeControl: options.timeControl,
            playerColor: colors[0]
          })
          
          io.to(opponent.socketId).emit('match_found', {
            matchId: opponent.id,
            roomId: roomId,
            opponent: {
              id: userId,
              name: playerName,
              rating: options.rating
            },
            timeControl: options.timeControl,
            playerColor: colors[1]
          })
        } else {
          // キューに追加
          matchingQueue.push(matchRequest)
          socket.emit('matching_started', { 
            requestId: matchRequest.id,
            queuePosition: matchingQueue.length
          })
        }
      }
    })

    // マッチングキャンセル
    socket.on('cancel_matching', (data) => {
      const { userId } = data
      const index = matchingQueue.findIndex(req => req.playerId === userId)
      
      if (index !== -1) {
        matchingQueue.splice(index, 1)
        socket.emit('matching_cancelled')
      }
    })

    // 対局招待
    socket.on('send_invite', (data) => {
      const { fromUserId, fromUserName, toUserId, timeControl, message } = data
      
      const invite = {
        id: generateInviteId(),
        fromPlayer: {
          id: fromUserId,
          name: fromUserName,
          socketId: socket.id
        },
        toPlayerId: toUserId,
        timeControl: timeControl,
        message: message,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 300000), // 5分後
        status: 'pending'
      }
      
      gameInvites.set(invite.id, invite)
      
      // 招待対象のプレイヤーを探す
      const targetSocket = Array.from(playerSockets.entries()).find(
        ([, info]) => info.userId === toUserId
      )?.[0]
      
      if (targetSocket) {
        io.to(targetSocket).emit('invite_received', invite)
        socket.emit('invite_sent', { inviteId: invite.id })
      } else {
        socket.emit('error', { message: 'プレイヤーがオンラインではありません' })
      }
      
      // 有効期限切れ処理
      setTimeout(() => {
        const currentInvite = gameInvites.get(invite.id)
        if (currentInvite && currentInvite.status === 'pending') {
          currentInvite.status = 'expired'
          socket.emit('invite_expired', { inviteId: invite.id })
          io.to(targetSocket).emit('invite_expired', { inviteId: invite.id })
        }
      }, 300000)
    })

    // 招待への返答
    socket.on('respond_invite', (data) => {
      const { inviteId, accept, userId } = data
      const invite = gameInvites.get(inviteId)
      
      if (!invite || invite.status !== 'pending') {
        socket.emit('error', { message: '無効な招待です' })
        return
      }
      
      if (invite.toPlayerId !== userId) {
        socket.emit('error', { message: '権限がありません' })
        return
      }
      
      invite.status = accept ? 'accepted' : 'declined'
      
      const fromSocket = invite.fromPlayer.socketId
      
      if (accept) {
        // ルームを作成
        const roomId = generateRoomId()
        const colors = Math.random() < 0.5 ? ['sente', 'gote'] : ['gote', 'sente']
        
        const room = {
          id: roomId,
          players: [
            {
              id: invite.fromPlayer.id,
              name: invite.fromPlayer.name,
              socketId: fromSocket,
              color: colors[0],
              connected: true
            },
            {
              id: userId,
              name: data.playerName,
              socketId: socket.id,
              color: colors[1],
              connected: true
            }
          ],
          gameState: null,
          timeControl: invite.timeControl,
          createdAt: new Date()
        }
        
        rooms.set(roomId, room)
        playerSockets.set(fromSocket, { roomId, userId: invite.fromPlayer.id })
        playerSockets.set(socket.id, { roomId, userId })
        
        // 両プレイヤーをルームに参加させる
        io.sockets.sockets.get(fromSocket)?.join(roomId)
        socket.join(roomId)
        
        // 両プレイヤーに通知
        io.to(fromSocket).emit('invite_accepted', {
          inviteId: invite.id,
          roomId: roomId,
          playerColor: colors[0]
        })
        
        socket.emit('invite_accepted', {
          inviteId: invite.id,
          roomId: roomId,
          playerColor: colors[1]
        })
      } else {
        io.to(fromSocket).emit('invite_declined', { inviteId: invite.id })
      }
      
      gameInvites.delete(inviteId)
    })

    // 切断処理
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
      
      // マッチングキューから削除
      const matchIndex = matchingQueue.findIndex(req => req.socketId === socket.id)
      if (matchIndex !== -1) {
        matchingQueue.splice(matchIndex, 1)
      }
      
      const playerInfo = playerSockets.get(socket.id)
      if (!playerInfo) return
      
      const { roomId, userId } = playerInfo
      const room = rooms.get(roomId)
      
      if (room) {
        // プレイヤーの接続状態を更新
        const player = room.players.find(p => p.id === userId)
        if (player) {
          player.connected = false
          socket.to(roomId).emit('opponent_disconnected', { playerId: userId })
        }
        
        // 一定時間後にルームをクリーンアップ
        setTimeout(() => {
          const currentRoom = rooms.get(roomId)
          if (currentRoom && currentRoom.players.every(p => !p.connected)) {
            rooms.delete(roomId)
            console.log('Room cleaned up:', roomId)
          }
        }, 300000) // 5分後
      }
      
      playerSockets.delete(socket.id)
    })
  })
}

// ルームID生成
function generateRoomId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// マッチID生成
function generateMatchId() {
  return 'match_' + Math.random().toString(36).substring(2, 15)
}

// 招待ID生成
function generateInviteId() {
  return 'invite_' + Math.random().toString(36).substring(2, 15)
}

// 時間設定の互換性チェック
function isTimeControlCompatible(tc1, tc2) {
  if (!tc1 || !tc2) return true
  
  // 同じ時間設定の場合のみマッチング
  return tc1.initial === tc2.initial && 
         tc1.increment === tc2.increment &&
         tc1.byoyomi === tc2.byoyomi
}