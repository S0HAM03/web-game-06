/**
 * index.js — Wordle Battle Server
 * Express + Socket.io, port 3005
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const {
  createRoom, joinRoom, startGame, submitGuess,
  removePlayer, resetRoom, getRoomBySocket, getPlayerList,
} = require('./gameLogic');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3005;

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(o => o.trim())
  : '*';

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.get('/health', (req, res) =>
  res.json({ status: 'ok', game: 'Wordle Battle', port: PORT })
);

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
});

// ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // ── CREATE ROOM ──────────────────────────────────────────────
  socket.on('create_room', ({ playerName }) => {
    if (!playerName?.trim()) {
      socket.emit('room_error', { message: 'Please enter your name.' });
      return;
    }
    const result = createRoom(socket.id, playerName);
    if (!result.success) { socket.emit('room_error', { message: result.message }); return; }

    socket.join(result.roomCode);
    socket.emit('room_created', { roomCode: result.roomCode });
    io.to(result.roomCode).emit('player_list', getPlayerList(result.room));
    console.log(`[ROOM] ${result.roomCode} created by "${playerName}"`);
  });

  // ── JOIN ROOM ────────────────────────────────────────────────
  socket.on('join_room', ({ roomCode, playerName }) => {
    if (!playerName?.trim()) {
      socket.emit('room_error', { message: 'Please enter your name.' });
      return;
    }
    if (!roomCode?.trim()) {
      socket.emit('room_error', { message: 'Please enter a room code.' });
      return;
    }
    const result = joinRoom(socket.id, roomCode, playerName);
    if (!result.success) { socket.emit('room_error', { message: result.message }); return; }

    socket.join(result.roomCode);
    socket.emit('room_joined', { roomCode: result.roomCode });
    io.to(result.roomCode).emit('player_list', getPlayerList(result.room));
    console.log(`[ROOM] "${playerName}" joined ${result.roomCode}`);
  });

  // ── START GAME ───────────────────────────────────────────────
  socket.on('start_game', () => {
    const result = startGame(socket.id);
    if (!result.success) { socket.emit('room_error', { message: result.message }); return; }

    io.to(result.roomCode).emit('game_start', {
      wordLength: 5,
      maxGuesses: 6,
      playerList: getPlayerList(result.room),
    });
    console.log(`[GAME] ${result.roomCode} started. Word: "${result.room.word}" (server-only)`);
  });

  // ── SUBMIT GUESS ─────────────────────────────────────────────
  socket.on('submit_guess', ({ guess }) => {
    const result = submitGuess(socket.id, guess);
    if (!result.success) {
      socket.emit('guess_error', { message: result.message });
      return;
    }

    // Send tile result to the guessing player only
    socket.emit('guess_result', {
      tiles: result.tiles,
      guess: result.guess,
      attempts: result.attempts,
      solved: result.solved,
      eliminated: result.eliminated,
    });

    // Broadcast updated progress to all players (no letters revealed)
    const progress = getPlayerList(result.room);
    io.to(result.room.code).emit('player_progress', progress);

    // If game is over broadcast to everyone
    if (result.gameOver) {
      // Build each player's board for the result screen
      const playerBoards = result.room.players.map(p => ({
        id: p.id,
        name: p.name,
        solved: p.solved,
        attempts: p.attempts,
        guesses: p.guesses, // reveal all boards on game over
        solvedAt: p.solvedAt,
      }));

      io.to(result.room.code).emit('game_over', {
        winnerId: result.winnerId,
        winnerName: result.winnerName,
        word: result.word,
        playerBoards,
      });
      console.log(`[GAME OVER] ${result.room.code} — winner: ${result.winnerName || 'none'}, word: "${result.word}"`);
    }
  });

  // ── PLAY AGAIN (host resets room) ────────────────────────────
  socket.on('play_again', () => {
    const result = resetRoom(socket.id);
    if (!result.success) { socket.emit('room_error', { message: result.message || 'Could not reset room.' }); return; }

    io.to(result.room.code).emit('rematch_ready', {
      playerList: getPlayerList(result.room),
    });
    console.log(`[REMATCH] ${result.room.code}`);
  });

  // ── DISCONNECT ───────────────────────────────────────────────
  socket.on('disconnect', () => {
    const result = removePlayer(socket.id);
    if (!result || result.destroyed) {
      console.log(`[-] Disconnected: ${socket.id} (room destroyed)`);
      return;
    }

    // Notify remaining players
    io.to(result.roomCode).emit('player_left', {
      playerList: getPlayerList(result.room),
      newHostId: result.newHostId,
    });

    // If game was in progress and only one player left, end it
    if (result.room.status === 'playing' && result.room.players.length === 1) {
      const lastPlayer = result.room.players[0];
      io.to(result.roomCode).emit('game_over', {
        winnerId: lastPlayer.id,
        winnerName: lastPlayer.name,
        word: result.room.word,
        reason: 'opponent_left',
        playerBoards: [{
          id: lastPlayer.id,
          name: lastPlayer.name,
          solved: lastPlayer.solved,
          attempts: lastPlayer.attempts,
          guesses: lastPlayer.guesses,
          solvedAt: lastPlayer.solvedAt,
        }],
      });
      result.room.status = 'finished';
    }

    console.log(`[-] Disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`\n🟩 Wordle Battle Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
