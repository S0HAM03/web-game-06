import { useState, useEffect } from 'react';
import { Swords, Users, ArrowRight, Hash } from 'lucide-react';

export default function LobbyScreen({ onCreate, onJoin, error, clearError }) {
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-clear error on input change
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
    <div className="lobby-root">
      {/* Logo */}
      <div className="lobby-logo">
        <div className="lobby-logo-icon">🟩</div>
        <h1 className="lobby-title">
          Wordle <span>Battle</span>
        </h1>
        <p className="lobby-subtitle">MULTIPLAYER WORD RACE · UP TO 4 PLAYERS</p>
      </div>

      {/* Card */}
      <div className="lobby-card">
        {/* Tabs */}
        <div className="lobby-tabs">
          <button
            className={`lobby-tab ${tab === 'create' ? 'active' : ''}`}
            onClick={() => { setTab('create'); clearError(); }}
          >
            Create Room
          </button>
          <button
            className={`lobby-tab ${tab === 'join' ? 'active' : ''}`}
            onClick={() => { setTab('join'); clearError(); }}
          >
            Join Room
          </button>
        </div>

        {/* Create Form */}
        {tab === 'create' && (
          <form className="lobby-form" onSubmit={handleCreate}>
            <div>
              <label className="input-label">Your Name</label>
              <input
                className="input"
                type="text"
                placeholder="Enter your name..."
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={16}
                autoFocus
                id="create-name"
              />
            </div>

            {error && (
              <div className="toast">
                <span>{error}</span>
              </div>
            )}

            <button
              className="btn btn-primary btn-full"
              type="submit"
              disabled={!name.trim() || loading}
              id="create-room-btn"
            >
              <Users size={16} />
              {loading ? 'Creating...' : 'Create Room'}
            </button>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center' }}>
              You'll get a 4-character code to share with friends
            </p>
          </form>
        )}

        {/* Join Form */}
        {tab === 'join' && (
          <form className="lobby-form" onSubmit={handleJoin}>
            <div>
              <label className="input-label">Your Name</label>
              <input
                className="input"
                type="text"
                placeholder="Enter your name..."
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={16}
                autoFocus
                id="join-name"
              />
            </div>

            <div>
              <label className="input-label">Room Code</label>
              <input
                className="input code-input"
                type="text"
                placeholder="ABCD"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().slice(0, 4))}
                maxLength={4}
                id="join-code"
              />
            </div>

            {error && (
              <div className="toast">
                <span>{error}</span>
              </div>
            )}

            <button
              className="btn btn-primary btn-full"
              type="submit"
              disabled={!name.trim() || code.trim().length < 4 || loading}
              id="join-room-btn"
            >
              <ArrowRight size={16} />
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </form>
        )}
      </div>

      {/* How to play */}
      <div style={{
        marginTop: '2rem', maxWidth: '420px', width: '100%',
        display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {[
          { icon: '🎯', text: 'Same word for all players' },
          { icon: '⚡', text: 'First to guess wins' },
          { icon: '🔒', text: '6 attempts each' },
        ].map(({ icon, text }) => (
          <div key={text} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            color: 'var(--text-muted)', fontSize: '0.78rem',
          }}>
            <span>{icon}</span><span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
