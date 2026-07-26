import { useState, useEffect } from 'react';
import { Users, ArrowRight } from 'lucide-react';

export default function LobbyScreen({ onCreate, onJoin, error, clearError }) {
  const [tab, setTab] = useState('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (error) clearError(); }, [name, code, tab]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    onCreate(name.trim());
    setTimeout(() => setLoading(false), 3000);
  };
  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setLoading(true);
    onJoin(name.trim(), code.trim().toUpperCase());
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className="game-bg lobby-root">
      {/* Logo */}
      <div className="lobby-logo">
        <div className="lobby-logo-icon">🟩</div>
        <h1 className="lobby-title display-font">
          WORDLE<span>BATTLE</span>
        </h1>
        <div className="lobby-subtitle">MULTIPLAYER WORD RACE · UP TO 4 PLAYERS</div>
      </div>

      {/* Card */}
      <div className="lobby-card">
        <div className="lobby-tabs">
          <button className={`lobby-tab ${tab === 'create' ? 'active' : ''}`} onClick={() => { setTab('create'); clearError(); }}>
            Create Room
          </button>
          <button className={`lobby-tab ${tab === 'join' ? 'active' : ''}`} onClick={() => { setTab('join'); clearError(); }}>
            Join Room
          </button>
        </div>

        {tab === 'create' && (
          <form className="lobby-form" onSubmit={handleCreate}>
            <div>
              <label className="input-label">Your Name</label>
              <input
                className="chunky-input"
                type="text"
                placeholder="ENTER NAME"
                value={name}
                onChange={e => setName(e.target.value.slice(0, 16))}
                maxLength={16}
                autoFocus
                id="create-name"
              />
            </div>
            {error && <div className="error-banner">⚠ {error}</div>}
            <button
              className="chunky-btn green full"
              type="submit"
              disabled={!name.trim() || loading}
              id="create-room-btn"
            >
              <Users size={18} />
              {loading ? 'Creating...' : 'Create Room'}
            </button>
            <p style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.78rem', color: '#666' }}>
              Play solo or share the code with up to 3 friends
            </p>
          </form>
        )}

        {tab === 'join' && (
          <form className="lobby-form" onSubmit={handleJoin}>
            <div>
              <label className="input-label">Your Name</label>
              <input
                className="chunky-input"
                type="text"
                placeholder="ENTER NAME"
                value={name}
                onChange={e => setName(e.target.value.slice(0, 16))}
                maxLength={16}
                autoFocus
                id="join-name"
              />
            </div>
            <div>
              <label className="input-label">Room Code</label>
              <input
                className="chunky-input"
                type="text"
                placeholder="ABCD"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
                maxLength={4}
                id="join-code"
              />
            </div>
            {error && <div className="error-banner">⚠ {error}</div>}
            <button
              className="chunky-btn pink full"
              type="submit"
              disabled={!name.trim() || code.trim().length < 4 || loading}
              id="join-room-btn"
            >
              <ArrowRight size={18} />
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </form>
        )}
      </div>

      {/* How to play chips */}
      <div className="how-to-chips">
        {[
          ['🎯', 'Same word for all'],
          ['⚡', 'First to solve wins'],
          ['🔒', '6 attempts each'],
          ['👤', 'Solo play supported'],
        ].map(([icon, text]) => (
          <div key={text} className="how-chip">{icon} {text}</div>
        ))}
      </div>
    </div>
  );
}
