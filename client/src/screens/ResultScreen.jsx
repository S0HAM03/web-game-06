import { useRef } from 'react';
import { Crown, RotateCcw, LogOut } from 'lucide-react';

const AV_CLASSES = ['av-0', 'av-1', 'av-2', 'av-3'];
const CONFETTI_COLORS = ['#00FF66','#FFD700','#00E5FF','#FF2A5F','#9D00FF','#FF6600','#000'];

function Confetti() {
  return (
    <div className="confetti-wrap" aria-hidden>
      {Array.from({ length: 70 }).map((_, i) => {
        const left     = Math.random() * 100;
        const delay    = Math.random() * 3;
        const duration = 3 + Math.random() * 3;
        const color    = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        const width    = 7 + Math.random() * 7;
        const height   = 8 + Math.random() * 8;
        return (
          <div key={i} className="confetti-piece" style={{
            left: `${left}%`, background: color,
            width, height,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
          }} />
        );
      })}
    </div>
  );
}

function MiniBoard({ guesses, maxGuesses = 6, wordLength = 5 }) {
  const rows = Array.from({ length: maxGuesses }, (_, ri) => {
    const g = guesses?.[ri];
    if (!g) return Array.from({ length: wordLength }, () => ({ status: '' }));
    return g.tiles;
  });
  return (
    <div className="mini-grid">
      {rows.map((row, ri) => (
        <div key={ri} className="mini-row">
          {row.map((cell, ci) => (
            <div key={ci} className={`mini-tile ${cell.status || ''}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ResultScreen({ myId, resultData, playerList, isHost, onPlayAgain, onLeave }) {
  const { winnerId, winnerName, word, playerBoards, reason } = resultData || {};
  const noWinner = !winnerId;
  const iWon     = winnerId === myId;

  // Sort: winner first, then by attempts
  const sorted = [...(playerBoards || [])].sort((a, b) => {
    if (a.id === winnerId) return -1;
    if (b.id === winnerId) return 1;
    if (a.solved && !b.solved) return -1;
    if (!a.solved && b.solved) return 1;
    return (a.solvedAt || Infinity) - (b.solvedAt || Infinity);
  });

  const avatarIdx = {};
  (playerList || []).forEach((p, i) => { avatarIdx[p.id] = i; });

  return (
    <div className="game-bg result-root">
      {iWon && <Confetti />}

      <div className="result-card">
        {/* Header */}
        <div className="result-header">
          {reason === 'opponent_left' ? (
            <>
              <div className="result-winner-label">🏆 You Win!</div>
              <div className="result-winner-name display-font">{winnerName}</div>
              <div className="result-winner-sub" style={{ color:'#FF6600' }}>Opponents disconnected</div>
            </>
          ) : noWinner ? (
            <>
              <div className="result-winner-label" style={{ color:'#FF2A5F' }}>😤 No Winner</div>
              <div className="result-winner-name display-font">BETTER LUCK!</div>
              <div className="result-winner-sub">Nobody solved the word</div>
            </>
          ) : iWon ? (
            <>
              <div className="result-winner-label">🏆 You Won!</div>
              <div className="result-winner-name display-font">CONGRATULATIONS!</div>
              <div className="result-winner-sub">You solved the word first 🎉</div>
            </>
          ) : (
            <>
              <div className="result-winner-label">🏆 Winner</div>
              <div className="result-winner-name display-font">{winnerName}</div>
              <div className="result-winner-sub">{winnerName} solved the word first</div>
            </>
          )}
        </div>

        {/* Word reveal */}
        <div className="result-word-reveal">
          <div className="result-word-lbl">The secret word was</div>
          <div className="result-word display-font">{word || '?????'}</div>
        </div>

        {/* Player boards */}
        <div className="result-boards">
          {sorted.map((board, rank) => {
            const isWinner = board.id === winnerId;
            const isMe     = board.id === myId;
            const avIdx    = avatarIdx[board.id] ?? rank;
            return (
              <div
                key={board.id}
                className={`result-board ${isWinner ? 'winner' : ''}`}
                style={{ animationDelay: `${rank * 0.1}s` }}
              >
                <div className="result-board-name">
                  {isWinner && <Crown size={14} color="#000" />}
                  <div className={`score-avatar ${AV_CLASSES[avIdx]}`} style={{ width:22, height:22, fontSize:'0.6rem' }}>
                    {board.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span>{board.name}{isMe ? ' (you)' : ''}</span>
                </div>
                <MiniBoard guesses={board.guesses} />
                <div className="result-stat">
                  {board.solved
                    ? <><b>{board.attempts}/6</b> guesses</>
                    : <span style={{ color:'#FF2A5F' }}>Did not solve</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="result-footer">
          {isHost ? (
            <button className="chunky-btn green" onClick={onPlayAgain} id="play-again-btn">
              <RotateCcw size={16} /> Play Again
            </button>
          ) : (
            <p style={{ fontWeight: 800, fontSize: '0.82rem', color: '#666' }}>
              Waiting for host to start a new game...
            </p>
          )}
          <button className="chunky-btn" onClick={onLeave} id="leave-result-btn">
            <LogOut size={14} /> Leave
          </button>
        </div>
      </div>
    </div>
  );
}
