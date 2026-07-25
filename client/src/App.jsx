import { useState, useEffect, useCallback } from 'react';
import socket from './socket';
import LobbyScreen from './screens/LobbyScreen';
import WaitingScreen from './screens/WaitingScreen';
import GameScreen from './screens/GameScreen';
import ResultScreen from './screens/ResultScreen';

// Screens: 'lobby' | 'waiting' | 'game' | 'result'

export default function App() {
  const [screen, setScreen] = useState('lobby');
  const [myId, setMyId] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [playerList, setPlayerList] = useState([]);
  const [gameConfig, setGameConfig] = useState(null);   // { wordLength, maxGuesses }
  const [resultData, setResultData] = useState(null);   // game over payload
  const [lobbyError, setLobbyError] = useState(null);

  // ── Socket lifecycle ────────────────────────────────────────────
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setMyId(socket.id);
    });

    // Lobby events
    socket.on('room_created', ({ roomCode }) => {
      setRoomCode(roomCode);
      setScreen('waiting');
      setLobbyError(null);
    });

    socket.on('room_joined', ({ roomCode }) => {
      setRoomCode(roomCode);
      setScreen('waiting');
      setLobbyError(null);
    });

    socket.on('room_error', ({ message }) => {
      setLobbyError(message);
    });

    // Waiting room
    socket.on('player_list', (list) => {
      setPlayerList(list);
    });

    // Game start
    socket.on('game_start', ({ wordLength, maxGuesses, playerList: list }) => {
      setGameConfig({ wordLength, maxGuesses });
      setPlayerList(list);
      setResultData(null);
      setScreen('game');
    });

    // Game over → result screen
    socket.on('game_over', (data) => {
      setResultData(data);
      setScreen('result');
    });

    // Play again → back to waiting room
    socket.on('rematch_ready', ({ playerList: list }) => {
      setPlayerList(list);
      setGameConfig(null);
      setResultData(null);
      setScreen('waiting');
    });

    // Player left mid-game
    socket.on('player_left', ({ playerList: list }) => {
      setPlayerList(list);
    });

    // Reconnect edge-case
    socket.on('disconnect', () => {
      // Keep state, let socket reconnect
    });

    return () => {
      socket.off('connect');
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('room_error');
      socket.off('player_list');
      socket.off('game_start');
      socket.off('game_over');
      socket.off('rematch_ready');
      socket.off('player_left');
      socket.off('disconnect');
    };
  }, []);

  // ── Actions ─────────────────────────────────────────────────────
  const handleCreate = useCallback((playerName) => {
    setLobbyError(null);
    socket.emit('create_room', { playerName });
  }, []);

  const handleJoin = useCallback((playerName, code) => {
    setLobbyError(null);
    socket.emit('join_room', { playerName, roomCode: code });
  }, []);

  const handleStartGame = useCallback(() => {
    socket.emit('start_game');
  }, []);

  const handlePlayAgain = useCallback(() => {
    socket.emit('play_again');
  }, []);

  const handleLeave = useCallback(() => {
    socket.disconnect();
    socket.connect();
    setScreen('lobby');
    setRoomCode(null);
    setPlayerList([]);
    setGameConfig(null);
    setResultData(null);
    setLobbyError(null);
  }, []);

  // ── Render ──────────────────────────────────────────────────────
  if (screen === 'lobby') {
    return (
      <LobbyScreen
        onCreate={handleCreate}
        onJoin={handleJoin}
        error={lobbyError}
        clearError={() => setLobbyError(null)}
      />
    );
  }

  if (screen === 'waiting') {
    return (
      <WaitingScreen
        roomCode={roomCode}
        playerList={playerList}
        myId={myId}
        onStartGame={handleStartGame}
        onLeave={handleLeave}
      />
    );
  }

  if (screen === 'game') {
    return (
      <GameScreen
        myId={myId}
        roomCode={roomCode}
        playerList={playerList}
        gameConfig={gameConfig}
        onGameOver={(data) => { setResultData(data); setScreen('result'); }}
      />
    );
  }

  if (screen === 'result') {
    return (
      <ResultScreen
        myId={myId}
        resultData={resultData}
        playerList={playerList}
        isHost={playerList.find(p => p.id === myId)?.isHost}
        onPlayAgain={handlePlayAgain}
        onLeave={handleLeave}
      />
    );
  }

  return null;
}
