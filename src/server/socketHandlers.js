const rooms = new Map()
const playerSockets = new Map()

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

    // 切断処理
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
      
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