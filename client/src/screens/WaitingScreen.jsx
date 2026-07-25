import { useState } from 'react';
import { Copy, Check, Crown, LogOut, Play } from 'lucide-react';

const AVATAR_CLASSES = ['', 'p2', 'p3', 'p4'];

export default function WaitingScreen({ roomCode, playerList, myId, onStartGame, onLeave }) {
  const [copied, setCopied] = useState(false);
  const me = playerList.find(p => p.id === myId);
  const isHost = me?.isHost;
  const canStart = playerList.length >= 2;
  const emptySlots = Math.max(0, 4 - playerList.length);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="waiting-root">
      <div className="waiting-card">

        {/* Room Code */}
        <div className="room-code-display">
          <div className="room-code-label">📋 Room Code — Share with friends</div>
          <div className="room-code-value" onClick={copyCode} title="Click to copy">
            {roomCode}
          </div>
          <div className="room-code-hint">
            {copied
              ? <span style={{ color: 'var(--green)' }}>✓ Copied to clipboard!</span>
              : 'Click to copy'}
          </div>
        </div>

        {/* Player List */}
        <div>
          <div className="player-list-title">
            Players
            <span className="count">{playerList.length} / 4</span>
          </div>

          {playerList.map((player, i) => (
            <div key={player.id} className="player-item">
              <div className={`player-avatar ${AVATAR_CLASSES[i]}`}>
                {player.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="player-name">{player.name}</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                {player.isHost && (
                  <span className="player-badge badge-host">
                    <Crown size={10} style={{ display: 'inline', marginRight: '3px' }} />
                    Host
                  </span>
                )}
                {player.id === myId && (
                  <span className="player-badge badge-you">You</span>
                )}
              </div>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} className="empty-slot">
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                border: '1px dashed var(--border-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', fontSize: '1rem',
              }}>+</div>
              <span>Waiting for player...</span>
            </div>
          ))}
        </div>

        {/* Status / Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isHost ? (
            <>
              <button
                className="btn btn-primary btn-full"
                onClick={onStartGame}
                disabled={!canStart}
                id="start-game-btn"
              >
                <Play size={16} fill="currentColor" />
                {canStart ? 'Start Game' : `Need ${2 - playerList.length} more player${2 - playerList.length !== 1 ? 's' : ''}`}
              </button>
              {!canStart && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  Minimum 2 players required
                </p>
              )}
            </>
          ) : (
            <div className="waiting-status">
              <span>Waiting for host to start</span>
              <div className="dot-pulse">
                <span /><span /><span />
              </div>
            </div>
          )}

          <button
            className="btn btn-ghost btn-full"
            onClick={onLeave}
            id="leave-btn"
          >
            <LogOut size={14} />
            Leave Room
          </button>
        </div>

        {/* Rules reminder */}
        <div style={{
          background: 'var(--bg-elevated)', borderRadius: '6px',
          padding: '12px 16px', border: '1px solid var(--border)',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.7 }}>
            🟩 <strong style={{ color: 'var(--text-primary)' }}>Correct</strong> letter, correct spot&nbsp;&nbsp;
            🟨 <strong style={{ color: 'var(--text-primary)' }}>Present</strong> but wrong spot&nbsp;&nbsp;
            ⬛ <strong style={{ color: 'var(--text-primary)' }}>Absent</strong> from the word
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '6px' }}>
            All players get the <strong style={{ color: 'var(--green)' }}>same secret 5-letter word</strong>. First to solve wins!
          </p>
        </div>

      </div>
    </div>
  );
}
