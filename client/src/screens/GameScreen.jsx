import { useState, useEffect, useCallback, useRef } from 'react';
import socket from '../socket';

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;
const AV_CLASSES = ['av-0','av-1','av-2','av-3'];
const REVEAL_DELAY_MS = 380; // gap between each tile reveal

const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
];

function emptyGrid() {
  return Array.from({ length: MAX_GUESSES }, () =>
    Array.from({ length: WORD_LENGTH }, () => ({ letter: '', status: '', cellState: 'empty' }))
  );
}

export default function GameScreen({ myId, roomCode, playerList: initialList }) {
  // grid stores committed/revealed rows only
  const [grid, setGrid]                   = useState(emptyGrid());
  const [currentRow, setCurrentRow]       = useState(0);
  const [currentInput, setCurrentInput]   = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [keyStates, setKeyStates]         = useState({});
  const [playerProgress, setPlayerProgress] = useState(initialList || []);
  const [shakingRow, setShakingRow]       = useState(null);
  const [toasts, setToasts]              = useState([]);
  const [mySolved, setMySolved]          = useState(false);
  const [myEliminated, setMyEliminated]  = useState(false);
  const toastId = useRef(0);

  const inputBlocked = mySolved || myEliminated || submitting;

  const addToast = useCallback((msg, type = '', duration = 1800) => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  // ── Socket events ────────────────────────────────────────────
  useEffect(() => {
    socket.on('guess_result', ({ tiles, attempts, solved, eliminated }) => {
      // Row index = attempts - 1 (0-indexed, safe from stale closures)
      const revealRow = attempts - 1;

      setSubmitting(false);
      setCurrentInput('');
      setCurrentRow(attempts); // move to next row immediately

      // KEY FIX: reveal tiles ONE BY ONE left-to-right using staggered timeouts
      // The `pending` state already hid the letters; now each tile flips in sequentially
      tiles.forEach((tile, i) => {
        setTimeout(() => {
          setGrid(prev => {
            const next = prev.map(r => r.map(c => ({ ...c })));
            next[revealRow][i] = {
              letter: tile.letter,
              status: tile.status,
              cellState: 'revealed',
            };
            return next;
          });
        }, i * REVEAL_DELAY_MS);
      });

      // Update keyboard colours after all tiles revealed
      const totalRevealTime = (WORD_LENGTH - 1) * REVEAL_DELAY_MS + 450;
      setTimeout(() => {
        setKeyStates(prev => {
          const priority = { correct: 3, present: 2, absent: 1 };
          const next = { ...prev };
          tiles.forEach(({ letter, status }) => {
            const l = letter.toUpperCase();
            if ((priority[status] || 0) > (priority[prev[l]] || 0)) next[l] = status;
          });
          return next;
        });

        if (solved) {
          setMySolved(true);
          addToast('🎉 You got it!', 'win', 4000);
        } else if (eliminated) {
          setMyEliminated(true);
          addToast('No more guesses!', 'error', 3000);
        }
      }, totalRevealTime);
    });

    socket.on('guess_error', ({ message }) => {
      setSubmitting(false);
      // shake uses currentRow captured in handler — use functional update to get latest
      setCurrentRow(row => { setShakingRow(row); setTimeout(() => setShakingRow(null), 600); return row; });
      addToast(message, 'error');
    });

    socket.on('player_progress', list => setPlayerProgress(list));

    return () => {
      socket.off('guess_result');
      socket.off('guess_error');
      socket.off('player_progress');
    };
  }, [addToast]);

  // ── Key handler ──────────────────────────────────────────────
  const handleKey = useCallback((key) => {
    if (inputBlocked) return;

    if (key === '⌫' || key === 'BACKSPACE' || key === 'DELETE') {
      setCurrentInput(prev => prev.slice(0, -1));
      return;
    }
    if (key === 'ENTER') {
      setCurrentRow(row => {
        if (currentInput.length !== WORD_LENGTH) {
          setShakingRow(row);
          setTimeout(() => setShakingRow(null), 600);
          addToast('Not enough letters', 'error');
          return row;
        }
        // Lock row: set to pending (hides letters visually)
        setGrid(prev => {
          const next = prev.map(r => r.map(c => ({ ...c })));
          for (let i = 0; i < WORD_LENGTH; i++) {
            next[row][i] = { letter: currentInput[i], status: '', cellState: 'pending' };
          }
          return next;
        });
        setSubmitting(true);
        socket.emit('submit_guess', { guess: currentInput });
        return row; // actual increment happens via setCurrentRow(attempts) in guess_result
      });
      return;
    }
    if (/^[A-Z]$/.test(key) && currentInput.length < WORD_LENGTH) {
      setCurrentInput(prev => prev + key);
    }
  }, [inputBlocked, currentInput, addToast]);

  // Physical keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toUpperCase();
      if (k === 'ENTER')     { handleKey('ENTER'); return; }
      if (k === 'BACKSPACE' || k === 'DELETE') { handleKey('⌫'); return; }
      if (/^[A-Z]$/.test(k)) handleKey(k);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleKey]);

  // ── Build display grid ────────────────────────────────────────
  // Current active row is overlaid with currentInput (only when NOT submitting)
  const displayGrid = grid.map((row, ri) => {
    if (ri === currentRow && !submitting) {
      return row.map((_, ci) => ({
        letter:    currentInput[ci] || '',
        status:    '',
        cellState: ci < currentInput.length ? 'typing' : 'empty',
      }));
    }
    return row;
  });

  // ── Score helpers ─────────────────────────────────────────────
  const barWidth = (p) => {
    if (p.solved || p.eliminated) return 100;
    return (p.attempts / MAX_GUESSES) * 100;
  };

  return (
    <div className="game-root">
      {/* Header */}
      <div className="game-header">
        <div className="game-header-title">WORDLE BATTLE</div>
        <div className="game-header-code">{roomCode}</div>
        <div className={`game-header-status ${mySolved ? 'solved' : myEliminated ? 'out' : ''}`}>
          {mySolved ? '✓ SOLVED!' : myEliminated ? '✗ OUT' : `Guess ${Math.min(currentRow + 1, MAX_GUESSES)} / ${MAX_GUESSES}`}
        </div>
      </div>

      {/* Toasts */}
      <div className="game-toast-wrap">
        {toasts.map(t => <div key={t.id} className={`game-toast ${t.type}`}>{t.msg}</div>)}
      </div>

      <div className="game-bg" style={{ flex: 1 }}>
        <div className="game-body">

          {/* ── Left: Grid + Keyboard ── */}
          <div className="game-left">
            {/* Grid */}
            <div className="wordle-grid">
              {displayGrid.map((row, ri) => (
                <div key={ri} className={`wordle-row ${shakingRow === ri ? 'shake' : ''}`}>
                  {row.map((cell, ci) => (
                    <div
                      key={ci}
                      className={`wordle-tile state-${cell.cellState} ${cell.status || ''}`}
                      aria-label={cell.letter}
                    >
                      {cell.cellState !== 'pending' ? cell.letter : ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Keyboard */}
            <div className="keyboard-wrap">
              {KEYBOARD_ROWS.map((row, ri) => (
                <div key={ri} className="keyboard-row">
                  {row.map(key => {
                    const isEnter = key === 'ENTER';
                    const isDel   = key === '⌫';
                    return (
                      <button
                        key={key}
                        id={`key-${key}`}
                        aria-label={key}
                        className={[
                          'key',
                          isEnter ? 'enter-key' : isDel ? 'delete-key' : '',
                          isEnter || isDel ? 'wide' : '',
                          keyStates[key] || '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => handleKey(key)}
                        disabled={inputBlocked && !isDel}
                      >
                        {isEnter ? '↵ ENTER' : key}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Status hint */}
            {!mySolved && !myEliminated && !submitting && (
              <p style={{ fontWeight: 800, fontSize: '0.78rem', color: '#555', textAlign: 'center' }}>
                Type a 5-letter word and press <b style={{ color: '#000' }}>↵ ENTER</b>
              </p>
            )}
            {myEliminated && (
              <p style={{ fontWeight: 800, fontSize: '0.85rem', color: '#FF2A5F', textAlign: 'center' }}>
                ✗ All guesses used — watch others finish!
              </p>
            )}
            {mySolved && (
              <p style={{ fontWeight: 900, fontSize: '0.9rem', color: '#6aaa64', textAlign: 'center' }}>
                🎉 You solved it! Waiting for game to end...
              </p>
            )}
          </div>

          {/* ── Right: Scoreboard ── */}
          <div className="game-right">
            <div className="scoreboard-label">🏆 Scoreboard</div>

            {playerProgress.map((p, i) => {
              const isMe = p.id === myId;
              const barClass = p.solved ? 'done' : p.eliminated ? 'failed' : '';
              return (
                <div
                  key={p.id}
                  className={`score-card ${isMe ? 'me-card' : ''} ${p.solved ? 'solved' : ''} ${p.eliminated ? 'out' : ''}`}
                >
                  <div className="score-card-top">
                    <div className={`score-avatar ${AV_CLASSES[i]}`}>
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="score-name">
                      {p.name}{isMe && <span style={{ color: '#aaa', fontWeight: 700 }}> (you)</span>}
                    </div>
                    {p.solved    && <div className="score-badge won">✓</div>}
                    {p.eliminated && !p.solved && <div className="score-badge out">✗</div>}
                  </div>
                  <div className="score-bar-track">
                    <div className={`score-bar-fill ${barClass}`} style={{ width: `${barWidth(p)}%` }} />
                  </div>
                  <div className="score-attempts">
                    {p.solved || p.eliminated ? `${p.attempts}/${MAX_GUESSES}` : `${p.attempts} used`}
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div style={{ background:'#fff', border:'3px solid #000', borderRadius:10, padding:'10px 12px', boxShadow:'3px 3px 0 #000', marginTop:8 }}>
              <div style={{ fontSize:'0.68rem', fontWeight:800, lineHeight:1.9, color:'#555' }}>
                <div>🟩 Right letter, right spot</div>
                <div>🟨 Letter in wrong spot</div>
                <div>⬛ Letter not in word</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
