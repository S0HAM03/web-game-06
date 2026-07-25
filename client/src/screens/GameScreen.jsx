import { useState, useEffect, useCallback, useRef } from 'react';
import socket from '../socket';

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;
const AVATAR_CLASSES = ['', 'p2', 'p3', 'p4'];

const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
];

// Build an empty 6x5 grid
function emptyGrid() {
  return Array.from({ length: MAX_GUESSES }, () =>
    Array.from({ length: WORD_LENGTH }, () => ({ letter: '', status: '' }))
  );
}

export default function GameScreen({ myId, roomCode, playerList: initialList, gameConfig }) {
  const [grid, setGrid] = useState(emptyGrid());
  const [currentRow, setCurrentRow] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [keyStates, setKeyStates] = useState({}); // letter → 'correct'|'present'|'absent'
  const [playerProgress, setPlayerProgress] = useState(initialList || []);
  const [shakingRow, setShakingRow] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [mySolved, setMySolved] = useState(false);
  const [myEliminated, setMyEliminated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputBlocked = mySolved || myEliminated || submitting;

  const toastId = useRef(0);

  const addToast = useCallback((msg, type = '', duration = 1800) => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  // ── Socket events ─────────────────────────────────────────────
  useEffect(() => {
    // Individual guess result (only to guesser)
    socket.on('guess_result', ({ tiles, guess, attempts, solved, eliminated }) => {
      setSubmitting(false);

      setGrid(prev => {
        const next = prev.map(r => [...r]);
        const row = currentRow;
        tiles.forEach((tile, i) => {
          next[row][i] = { letter: tile.letter, status: tile.status, revealed: true, delay: i };
        });
        return next;
      });

      // Update key states (only upgrade: correct > present > absent)
      setKeyStates(prev => {
        const next = { ...prev };
        const priority = { correct: 3, present: 2, absent: 1 };
        tiles.forEach(({ letter, status }) => {
          const l = letter.toUpperCase();
          if ((priority[status] || 0) > (priority[prev[l]] || 0)) {
            next[l] = status;
          }
        });
        return next;
      });

      setCurrentRow(r => r + 1);
      setCurrentInput('');

      if (solved) {
        setMySolved(true);
        addToast('🎉 You got it!', 'win', 4000);
      } else if (eliminated) {
        setMyEliminated(true);
        addToast('No more guesses — watch others!', '', 3000);
      }
    });

    // Guess error (invalid word, etc.)
    socket.on('guess_error', ({ message }) => {
      setSubmitting(false);
      // Shake current row
      setShakingRow(currentRow);
      setTimeout(() => setShakingRow(null), 600);
      addToast(message, 'error');
    });

    // Live progress from all players
    socket.on('player_progress', (list) => {
      setPlayerProgress(list);
    });

    return () => {
      socket.off('guess_result');
      socket.off('guess_error');
      socket.off('player_progress');
    };
  }, [currentRow, addToast]);

  // ── Keyboard input ────────────────────────────────────────────
  const handleKey = useCallback((key) => {
    if (inputBlocked) return;

    if (key === '⌫' || key === 'BACKSPACE') {
      setCurrentInput(prev => prev.slice(0, -1));
      return;
    }

    if (key === 'ENTER') {
      if (currentInput.length !== WORD_LENGTH) {
        setShakingRow(currentRow);
        setTimeout(() => setShakingRow(null), 600);
        addToast('Not enough letters', 'error');
        return;
      }
      setSubmitting(true);
      socket.emit('submit_guess', { guess: currentInput });
      return;
    }

    if (/^[A-Z]$/.test(key) && currentInput.length < WORD_LENGTH) {
      setCurrentInput(prev => prev + key);
    }
  }, [inputBlocked, currentInput, currentRow, addToast]);

  // Physical keyboard
  useEffect(() => {
    const onKeyDown = (e) => {
      const key = e.key.toUpperCase();
      if (key === 'ENTER') { handleKey('ENTER'); return; }
      if (key === 'BACKSPACE') { handleKey('⌫'); return; }
      if (/^[A-Z]$/.test(key)) { handleKey(key); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey]);

  // ── Build display grid (merge committed + current input) ──────
  const displayGrid = grid.map((row, ri) => {
    if (ri === currentRow) {
      // Active row — overlay current input
      return row.map((cell, ci) => ({
        letter: currentInput[ci] || '',
        status: '',
        revealed: false,
        delay: ci,
      }));
    }
    return row;
  });

  // ── Score panel helper ────────────────────────────────────────
  const getScoreBarWidth = (p) => {
    if (p.solved) return 100;
    if (p.eliminated) return 100;
    return (p.attempts / MAX_GUESSES) * 100;
  };

  const myProgress = playerProgress.find(p => p.id === myId);
  const myIndex = playerProgress.findIndex(p => p.id === myId);

  return (
    <div className="game-root">
      {/* Header */}
      <div className="game-header">
        <div className="game-header-title">WORDLE BATTLE</div>
        <div className="game-header-info">
          Room: <strong style={{ color: 'var(--green)', letterSpacing: '2px', fontFamily: 'JetBrains Mono, monospace' }}>{roomCode}</strong>
        </div>
        <div className="game-header-info">
          {mySolved
            ? <span style={{ color: 'var(--tile-correct)', fontWeight: 700 }}>✓ Solved!</span>
            : myEliminated
            ? <span style={{ color: 'var(--error)' }}>✗ Out of guesses</span>
            : <span>Guess {currentRow + 1} / {MAX_GUESSES}</span>}
        </div>
      </div>

      {/* Toasts */}
      <div className="game-toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`game-toast ${t.type}`}>{t.msg}</div>
        ))}
      </div>

      {/* Body */}
      <div className="game-body">
        {/* Left: Grid + Keyboard */}
        <div className="game-left">
          {/* Grid */}
          <div className="wordle-grid" aria-label="Wordle grid">
            {displayGrid.map((row, ri) => (
              <div
                key={ri}
                className={`wordle-row ${shakingRow === ri ? 'shake' : ''}`}
              >
                {row.map((cell, ci) => {
                  let cls = 'wordle-tile';
                  if (cell.revealed) {
                    cls += ` revealed delay-${cell.delay}`;
                    if (cell.status) cls += ` ${cell.status}`;
                  } else if (cell.letter) {
                    cls += ' filled';
                  }
                  return (
                    <div key={ci} className={cls} aria-label={cell.letter}>
                      {cell.letter}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Keyboard */}
          <div className="keyboard-wrap">
            {KEYBOARD_ROWS.map((row, ri) => (
              <div key={ri} className="keyboard-row">
                {row.map(key => (
                  <button
                    key={key}
                    className={`key ${key.length > 1 ? 'wide' : ''} ${keyStates[key] || ''}`}
                    onClick={() => handleKey(key)}
                    disabled={inputBlocked && key !== '⌫'}
                    aria-label={key}
                    id={`key-${key}`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Instruction text */}
          {!mySolved && !myEliminated && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>
              Type a 5-letter word and press <strong style={{ color: 'var(--text-secondary)' }}>ENTER</strong>
            </p>
          )}
          {myEliminated && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center' }}>
              You've used all your guesses. Watch the other players! ⏳
            </p>
          )}
          {mySolved && (
            <p style={{ color: 'var(--tile-correct)', fontSize: '0.9rem', fontWeight: 700, textAlign: 'center' }}>
              🎉 You solved it! Waiting for others to finish...
            </p>
          )}
        </div>

        {/* Right: Scoreboard */}
        <div className="game-right">
          <div className="scoreboard-title">Live Scoreboard</div>

          {playerProgress.map((player, i) => {
            const isMe = player.id === myId;
            const pct = getScoreBarWidth(player);
            const barClass = player.solved ? 'full' : player.eliminated ? 'failed' : '';

            return (
              <div
                key={player.id}
                className={`score-card ${isMe ? 'me' : ''} ${player.solved ? 'solved' : ''} ${player.eliminated ? 'eliminated' : ''}`}
              >
                <div className="score-card-header">
                  <div className={`score-avatar ${AVATAR_CLASSES[i]}`}>
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="score-name">
                    {player.name}{isMe && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> (you)</span>}
                  </div>
                  {player.solved && <div className="score-status solved-label">✓ SOLVED</div>}
                  {player.eliminated && !player.solved && <div className="score-status eliminated-label">✗ OUT</div>}
                </div>
                <div className="score-bar-track">
                  <div
                    className={`score-bar-fill ${barClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="score-attempts-text">
                  {player.solved || player.eliminated
                    ? `${player.attempts} / ${MAX_GUESSES} guesses`
                    : `${player.attempts} guess${player.attempts !== 1 ? 'es' : ''} used`}
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div style={{
            marginTop: '1rem',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '6px', padding: '10px 12px',
          }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <div>🟩 Letter in right spot</div>
              <div>🟨 Letter in wrong spot</div>
              <div>⬛ Letter not in word</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
