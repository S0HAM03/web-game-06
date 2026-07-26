/**
 * gameLogic.js — Wordle Battle Room & Game State Management
 */

const { getRandomWord, isValidWord } = require('./words');

// rooms: Map<roomCode, Room>
// socketToRoom: Map<socketId, roomCode>
const rooms = new Map();
const socketToRoom = new Map();

// ── Helpers ──────────────────────────────────────────────────────

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function getPlayerList(room) {
  return room.players.map(p => ({
    id: p.id,
    name: p.name,
    isHost: p.id === room.hostId,
    solved: p.solved,
    attempts: p.attempts,
    eliminated: p.eliminated,
  }));
}

function getRoomBySocket(socketId) {
  const code = socketToRoom.get(socketId);
  return code ? rooms.get(code) : null;
}

// ── Evaluate a guess against the secret word ──────────────────────
// Returns array of { letter, status: 'correct'|'present'|'absent' }
function evaluateGuess(guess, answer) {
  const result = Array(5).fill(null).map((_, i) => ({
    letter: guess[i],
    status: 'absent',
  }));

  const answerArr = answer.split('');
  const guessArr = guess.split('');

  // First pass: mark correct
  const remaining = [];
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === answerArr[i]) {
      result[i].status = 'correct';
      answerArr[i] = null; // consume
    } else {
      remaining.push(i);
    }
  }

  // Second pass: mark present
  for (const i of remaining) {
    const idx = answerArr.indexOf(guessArr[i]);
    if (idx !== -1) {
      result[i].status = 'present';
      answerArr[idx] = null;
    }
  }

  return result;
}

// ── Room operations ───────────────────────────────────────────────

function createRoom(socketId, playerName) {
  if (socketToRoom.has(socketId)) {
    return { success: false, message: 'You are already in a room.' };
  }
  const code = generateCode();
  const room = {
    code,
    hostId: socketId,
    status: 'waiting', // 'waiting' | 'playing' | 'finished'
    word: null,
    startedAt: null,
    players: [
      {
        id: socketId,
        name: playerName.trim().slice(0, 16),
        guesses: [],   // array of evaluated guess rows
        solved: false,
        solvedAt: null,
        attempts: 0,
        eliminated: false,
      },
    ],
  };
  rooms.set(code, room);
  socketToRoom.set(socketId, code);
  return { success: true, roomCode: code, room };
}

function joinRoom(socketId, roomCode, playerName) {
  const code = roomCode.toUpperCase().trim();
  if (socketToRoom.has(socketId)) {
    return { success: false, message: 'You are already in a room.' };
  }
  const room = rooms.get(code);
  if (!room) return { success: false, message: 'Room not found. Check the code.' };
  if (room.status !== 'waiting') return { success: false, message: 'Game already in progress.' };
  if (room.players.length >= 4) return { success: false, message: 'Room is full (max 4 players).' };

  const nameTrimmed = playerName.trim().slice(0, 16);
  room.players.push({
    id: socketId,
    name: nameTrimmed,
    guesses: [],
    solved: false,
    solvedAt: null,
    attempts: 0,
    eliminated: false,
  });
  socketToRoom.set(socketId, code);
  return { success: true, roomCode: code, room };
}

function startGame(socketId) {
  const room = getRoomBySocket(socketId);
  if (!room) return { success: false, message: 'Room not found.' };
  if (room.hostId !== socketId) return { success: false, message: 'Only the host can start the game.' };
  if (room.players.length < 1) return { success: false, message: 'No players in room.' };
  if (room.status !== 'waiting') return { success: false, message: 'Game already started.' };

  room.word = getRandomWord();
  room.status = 'playing';
  room.startedAt = Date.now();
  // Reset all players
  room.players.forEach(p => {
    p.guesses = [];
    p.solved = false;
    p.solvedAt = null;
    p.attempts = 0;
    p.eliminated = false;
  });

  return { success: true, room, roomCode: room.code };
}

function submitGuess(socketId, guessRaw) {
  const room = getRoomBySocket(socketId);
  if (!room) return { success: false, message: 'Room not found.' };
  if (room.status !== 'playing') return { success: false, message: 'Game is not in progress.' };

  const player = room.players.find(p => p.id === socketId);
  if (!player) return { success: false, message: 'Player not found.' };
  if (player.solved) return { success: false, message: 'You already solved it!' };
  if (player.eliminated) return { success: false, message: 'You have used all your guesses.' };

  const guess = guessRaw.toUpperCase().trim();
  if (guess.length !== 5) return { success: false, message: 'Guess must be 5 letters.' };
  if (!isValidWord(guess)) return { success: false, message: 'Not in word list.' };

  const tiles = evaluateGuess(guess, room.word);
  player.attempts++;
  player.guesses.push({ guess, tiles });

  const solved = tiles.every(t => t.status === 'correct');
  if (solved) {
    player.solved = true;
    player.solvedAt = Date.now();
  }

  const eliminated = !solved && player.attempts >= 6;
  if (eliminated) player.eliminated = true;

  // Check if game is over: first solver OR all players done
  const activePlayers = room.players.filter(p => !p.eliminated && !p.solved);
  const winner = room.players.find(p => p.solved);
  const allDone = activePlayers.length === 0;

  let gameOver = false;
  let winnerId = null;
  let winnerName = null;

  if (winner) {
    gameOver = true;
    winnerId = winner.id;
    winnerName = winner.name;
  } else if (allDone) {
    gameOver = true; // no winner (everyone ran out)
  }

  if (gameOver) room.status = 'finished';

  return {
    success: true,
    tiles,
    guess,
    attempts: player.attempts,
    solved,
    eliminated,
    gameOver,
    winnerId,
    winnerName,
    word: gameOver ? room.word : null,
    room,
  };
}

function removePlayer(socketId) {
  const code = socketToRoom.get(socketId);
  if (!code) return null;
  const room = rooms.get(code);
  if (!room) { socketToRoom.delete(socketId); return null; }

  const idx = room.players.findIndex(p => p.id === socketId);
  if (idx !== -1) room.players.splice(idx, 1);
  socketToRoom.delete(socketId);

  // If host leaves, reassign or destroy
  if (room.hostId === socketId) {
    if (room.players.length > 0) {
      room.hostId = room.players[0].id;
    } else {
      rooms.delete(code);
      return { roomCode: code, hostChanged: false, destroyed: true };
    }
  }

  if (room.players.length === 0) {
    rooms.delete(code);
    return { roomCode: code, destroyed: true };
  }

  return {
    roomCode: code,
    destroyed: false,
    newHostId: room.hostId,
    remainingPlayers: room.players.map(p => p.id),
    room,
  };
}

function resetRoom(socketId) {
  const room = getRoomBySocket(socketId);
  if (!room) return { success: false };
  if (room.hostId !== socketId) return { success: false, message: 'Only host can reset.' };

  room.status = 'waiting';
  room.word = null;
  room.startedAt = null;
  room.players.forEach(p => {
    p.guesses = [];
    p.solved = false;
    p.solvedAt = null;
    p.attempts = 0;
    p.eliminated = false;
  });
  return { success: true, room };
}

module.exports = {
  createRoom,
  joinRoom,
  startGame,
  submitGuess,
  removePlayer,
  resetRoom,
  getRoomBySocket,
  getPlayerList,
};
