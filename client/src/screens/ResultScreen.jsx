import { useEffect, useRef } from 'react';
import { Crown, RotateCcw, LogOut, Trophy } from 'lucide-react';

const AVATAR_CLASSES = ['', 'p2', 'p3', 'p4'];
const CONFETTI_COLORS = ['#85b934','#538d4e','#b59f3b','#a950ff','#ff4500','#00bfff','#fff'];

function Confetti() {
  return (
    <div className="confetti-wrap" aria-hidden>
      {Array.from({ length: 60 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 3;
        const duration = 3 + Math.random() * 3;
        const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        const rotate = Math.random() > 0.5 ? 0 : 45;
        return (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${left}%`,
              background: color,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              transform: `rotate(${rotate}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

function MiniBoard({ guesses, maxGuesses = 6, wordLength = 5 }) {
  // Build full 6-row mini board
  const rows = Array.from({ length: maxGuesses }, (_, ri) => {
    const guess = guesses?.[ri];
    if (!guess) {
      return Array.from({ length: wordLength }, () => ({ status: 'empty' }));
    }
    return guess.tiles;
  });

  return (
    <div className="mini-grid">
      {rows.map((row, ri) => (
        <div key={ri} className="mini-row">
          {row.map((cell, ci) => (
            <div
              key={ci}
              className={`mini-tile ${cell.status || 'empty'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ResultScreen({ myId, resultData, playerList, isHost, onPlayAgain, onLeave }) {
  const { winnerId, winnerName, word, playerBoards, reason } = resultData || {};
  const noWinner = !winnerId;
  const iWon = winnerId === myId;

  // Sort boards: winner first
  const sortedBoards = [...(playerBoards || [])].sort((a, b) => {
    if (a.id === winnerId) return -1;
    if (b.id === winnerId) return 1;
    if (a.solved && !b.solved) return -1;
    if (!a.solved && b.solved) return 1;
    return (a.solvedAt || Infinity) - (b.solvedAt || Infinity);
  });

  // Map playerId → avatar index (from original playerList order)
  const avatarIndex = {};
  (playerList || []).forEach((p, i) => { avatarIndex[p.id] = i; });

  return (
    <div className="result-root">
      {iWon && <Confetti />}

      <div className="result-card" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="result-header">
          {reason === 'opponent_left' ? (
            <>
              <div className="result-winner-label">🏆 You Win!</div>
              <div className="result-winner-name">{winnerName}</div>
              <div className="result-winner-sub" style={{ color: 'var(--warn)' }}>
                Other players disconnected
              </div>
            </>
          ) : noWinner ? (
            <>
              <div className="result-winner-label" style={{ color: 'var(--error)' }}>
                😤 No Winner
              </div>
              <div className="result-winner-name" style={{ fontSize: '1.8rem' }}>
                Better luck next time!
              </div>
              <div className="result-winner-sub">Nobody solved the word</div>
            </>
          ) : (
            <>
              <div className="result-winner-label">
                🏆 {iWon ? 'You Won!' : 'Winner'}
              </div>
              <div className="result-winner-name">
                {iWon ? '🎉 Congratulations!' : winnerName}
              </div>
              <div className="result-winner-sub">
                {iWon
                  ? 'You solved the word first!'
                  : `${winnerName} solved the word first`}
              </div>
            </>
          )}
        </div>

        {/* Word reveal */}
        <div className="result-word-reveal">
          <div className="result-word-label">The secret word was</div>
          <div className="result-word">{word || '?????'}</div>
        </div>

        {/* All player boards */}
        <div className="result-boards">
          {sortedBoards.map((board, rank) => {
            const isWinner = board.id === winnerId;
            const isMe = board.id === myId;
            const avatarIdx = avatarIndex[board.id] ?? rank;

            return (
              <div
                key={board.id}
                className={`result-player-board ${isWinner ? 'winner' : ''}`}
                style={{ animationDelay: `${rank * 0.1}s` }}
              >
                {/* Player name + badge */}
                <div className="result-player-name">
                  {isWinner && <Crown size={14} className="crown" />}
                  <div className={`score-avatar ${AVATAR_CLASSES[avatarIdx]}`} style={{ width: '24px', height: '24px', fontSize: '0.65rem' }}>
                    {board.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span>{board.name}{isMe ? ' (you)' : ''}</span>
                </div>

                {/* Mini board */}
                <MiniBoard guesses={board.guesses} />

                {/* Stat */}
                <div className="result-stat">
                  {board.solved
                    ? <><strong>{board.attempts}/6</strong> guesses</>
                    : <span style={{ color: 'var(--error)' }}>Did not solve</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="result-footer">
          {isHost ? (
            <button
              className="btn btn-primary"
              onClick={onPlayAgain}
              id="play-again-btn"
            >
              <RotateCcw size={15} />
              Play Again
            </button>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Waiting for host to start a new game...
            </p>
          )}
          <button
            className="btn btn-ghost"
            onClick={onLeave}
            id="leave-result-btn"
          >
            <LogOut size={14} />
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
