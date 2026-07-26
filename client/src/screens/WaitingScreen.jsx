import { useState } from 'react';
import { Crown, Play, LogOut } from 'lucide-react';

const AV_CLASSES = ['av-0','av-1','av-2','av-3'];

export default function WaitingScreen({ roomCode, playerList, myId, onStartGame, onLeave }) {
  const [copied, setCopied] = useState(false);
  const me = playerList.find(p => p.id === myId);
  const isHost = me?.isHost;
  const isSolo = playerList.length === 1 && isHost;
  const emptySlots = Math.max(0, 4 - playerList.length);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="game-bg waiting-root">
      <div className="waiting-card">

        {/* Room Code */}
        <div>
          <div className="player-list-header">
            <span>📋 Room Code</span>
          </div>
          <div className="room-code-box" onClick={copyCode} title="Click to copy">
            <div className="room-code-label">
              {copied ? '✅ Copied!' : 'Share with friends → click to copy'}
            </div>
            <div className="room-code-value">{roomCode}</div>
            <div className="room-code-hint">4-character code · max 4 players</div>
          </div>
        </div>

        {/* Player list */}
        <div>
          <div className="player-list-header">
            Players
            <span className="player-count-badge">{playerList.length} / 4</span>
          </div>

          {playerList.map((p, i) => (
            <div key={p.id} className="player-row">
              <div className={`player-avatar ${AV_CLASSES[i]}`}>
                {p.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="player-row-name">{p.name}</span>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {p.isHost && <span className="badge badge-host"><Crown size={9} style={{ display:'inline' }} /> Host</span>}
                {p.id === myId && <span className="badge badge-you">You</span>}
                {isSolo && <span className="badge badge-single">Solo</span>}
              </div>
            </div>
          ))}

          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`e${i}`} className="empty-slot">
              <div style={{ width:36, height:36, borderRadius:'50%', border:'2px dashed #ccc', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', color:'#ccc' }}>+</div>
              Waiting for player...
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {isHost ? (
            <>
              <button
                className="chunky-btn green full"
                onClick={onStartGame}
                id="start-game-btn"
              >
                <Play size={18} fill="currentColor" />
                {isSolo ? 'Play Solo' : 'Start Game'}
              </button>
              {isSolo && (
                <p style={{ textAlign:'center', fontWeight:800, fontSize:'0.78rem', color:'#666' }}>
                  🎮 You're playing solo — try to beat 6 attempts!
                </p>
              )}
            </>
          ) : (
            <div style={{ textAlign:'center', fontWeight:800, fontSize:'0.85rem', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
              Waiting for host to start
              <div className="dot-pulse"><span/><span/><span/></div>
            </div>
          )}
          <button className="chunky-btn full" onClick={onLeave} id="leave-btn">
            <LogOut size={14} /> Leave Room
          </button>
        </div>

        {/* Rules */}
        <div style={{ background:'#f4f4f5', border:'3px solid #000', borderRadius:10, padding:'12px 16px', boxShadow:'3px 3px 0 #000' }}>
          <p style={{ fontWeight:800, fontSize:'0.78rem', lineHeight:1.8, color:'#333' }}>
            🟩 <b>Correct</b> letter, right spot &nbsp;·&nbsp;
            🟨 <b>Present</b> but wrong spot &nbsp;·&nbsp;
            ⬛ <b>Absent</b> — not in word
          </p>
          <p style={{ fontWeight:800, fontSize:'0.75rem', marginTop:6, color:'#666' }}>
            All players get the <b style={{ color:'#000' }}>same secret 5-letter word</b>. First to solve wins!
          </p>
        </div>

      </div>
    </div>
  );
}
