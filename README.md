# 🟩 Wordle Battle — Multiplayer Word Race

A real-time multiplayer Wordle game where up to **4 players** race to solve the **same secret 5-letter word**. First to guess it wins! Fully playable solo too.

Built with the same **Neo-Brutalism** aesthetic as the Soham Games Hub — Bungee font, thick black borders, chunky neon buttons.

![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Socket.io-00E5FF?style=for-the-badge)
![Players](https://img.shields.io/badge/Players-1--4-FFD700?style=for-the-badge)
![Words](https://img.shields.io/badge/Dictionary-14%2C855%20words-00FF66?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-FF2A5F?style=for-the-badge)

---

## 🎮 How to Play

1. **Create a Room** — Enter your name and create a lobby. You get a 4-character room code.
2. **Share the Code** — Share it with up to 3 friends, or play solo.
3. **Start the Game** — Host clicks **Start Game** (works with just 1 player too).
4. **Race!** — Everyone gets the **same secret 5-letter word**. Type your guesses and hit **↵ ENTER**.
5. **Win!** — First to correctly guess the word wins. All boards are revealed at the end.

### Tile Colours
| Colour | Meaning |
|--------|---------|
| 🟩 Green | Correct letter, correct position |
| 🟨 Yellow | Letter in word, wrong position |
| ⬛ Grey | Letter not in the word |

---

## ✨ Features

- **Single Player** — Practice solo, no friends needed
- **Up to 4 Players** — Real-time multiplayer lobby with room codes
- **Anti-Cheat** — Secret word lives only on the server, never sent to clients
- **One-by-One Tile Reveal** — Letters flip in left → right after each guess
- **Live Scoreboard** — See all players' attempt counts update in real-time
- **Large Dictionary** — 14,855+ valid guess words fetched from the internet at startup
- **Medium-Hard Words** — Easy words filtered out from answers
- **Physical + On-Screen Keyboard** — Type or tap, both supported
- **Shake Animation** — Invalid words shake the row
- **Key Colouring** — On-screen keyboard updates with correct/present/absent colours
- **Confetti** — Winner gets a confetti burst on the result screen
- **All Boards Revealed** — After game over, every player's full board is shown
- **Play Again** — Host resets with a new word without leaving the lobby
- **Disconnect Handling** — Game continues if a player leaves mid-round

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Server** | Node.js + Express + Socket.io |
| **Client** | React 19 + Vite 6 |
| **Styling** | Vanilla CSS — Neo-Brutalism design system |
| **Fonts** | Bungee (display) + Nunito (body) via Google Fonts |
| **Icons** | Lucide React |
| **Real-time** | WebSockets via Socket.io |
| **Dictionary** | tabatkins/wordle-list (fetched at startup) |

---

## 📁 Project Structure

```
wordle-battle/
├── server/                     # Node.js backend
│   ├── index.js                # Express + Socket.io server (port 3005)
│   ├── gameLogic.js            # Room management, word evaluation, game state
│   ├── words.js                # Word bank — fetches 14k+ words from internet on startup
│   ├── .env                    # Environment config (PORT, CLIENT_ORIGIN)
│   └── package.json
│
└── client/                     # React + Vite frontend
    ├── src/
    │   ├── App.jsx              # Root — screen router + all socket listeners
    │   ├── socket.js            # socket.io-client singleton
    │   ├── index.css            # Neo-Brutalism design system
    │   ├── main.jsx             # React entry point
    │   └── screens/
    │       ├── LobbyScreen.jsx     # Create / Join room
    │       ├── WaitingScreen.jsx   # Lobby with live player list + room code
    │       ├── GameScreen.jsx      # Wordle grid + keyboard + live scoreboard
    │       └── ResultScreen.jsx    # Winner reveal + all boards + play again
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- npm

### 1. Clone the repo
```bash
git clone https://github.com/S0HAM03/web-game-06.git
cd web-game-06
```

### 2. Start the Server
```bash
cd server
npm install
npm start
# Server runs on http://localhost:3005
# Fetches word list from internet on first start
```

### 3. Start the Client
```bash
cd client
npm install
npm run dev
# Client runs on http://localhost:5173
```

### 4. Play
Open **http://localhost:5173** in multiple browser tabs or on different devices on the same network.

---

## 🌐 Deployment

### Recommended Setup

| Part | Platform |
|------|---------|
| **Backend** | [Railway](https://railway.app) · [Render](https://render.com) · [Fly.io](https://fly.io) · [Koyeb](https://koyeb.com) |
| **Frontend** | [Vercel](https://vercel.com) · [Netlify](https://netlify.com) · [Cloudflare Pages](https://pages.cloudflare.com) |

> ⚠️ The backend uses **persistent WebSocket connections** — do NOT host it on Vercel or Netlify (serverless only). Use Railway, Render, or any platform that supports long-running Node.js processes.

### Server Environment Variables
```env
PORT=3005
CLIENT_ORIGIN=https://your-frontend-domain.com
```

### Client Environment Variables
```env
VITE_SERVER_URL=https://your-backend-domain.com
```

---

## 🔌 Socket Events Reference

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `create_room` | `{ playerName }` | Create a new lobby |
| `join_room` | `{ playerName, roomCode }` | Join an existing lobby |
| `start_game` | — | Host starts the game (1–4 players) |
| `submit_guess` | `{ guess }` | Submit a 5-letter guess |
| `play_again` | — | Host resets room for a new round |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `room_created` | `{ roomCode }` | Room successfully created |
| `room_joined` | `{ roomCode }` | Successfully joined room |
| `room_error` | `{ message }` | Error (room full, not found, etc.) |
| `player_list` | `[players]` | Updated player list in lobby |
| `game_start` | `{ wordLength, maxGuesses, playerList, isSinglePlayer }` | Game begins |
| `guess_result` | `{ tiles, attempts, solved, eliminated }` | Private result of your guess |
| `guess_error` | `{ message }` | Invalid word (not in dictionary) |
| `player_progress` | `[players]` | All players' attempt counts (broadcast) |
| `game_over` | `{ winnerId, word, playerBoards }` | Game ended — all boards revealed |
| `rematch_ready` | `{ playerList }` | Room reset for new round |
| `player_left` | `{ playerList, newHostId }` | A player disconnected |

---

## 🎨 Design System

Matches the **Neo-Brutalism** style used across the Soham Games Hub:

- **Background** — `#f4f4f5` with radial dot grid pattern
- **Fonts** — Bungee (headings/display) + Nunito 700–900 (body)
- **Borders** — 4px solid `#000` on all cards, buttons, tiles
- **Shadows** — `6px 6px 0px #000` (chunky hard drop shadow)
- **Accent colours** — `#00FF66` · `#FFD700` · `#00E5FF` · `#FF2A5F` · `#9D00FF`
- **Tile colours** — `#6aaa64` correct · `#c9b458` present · `#787c7e` absent

---

## 🕹️ Part of Soham Games Hub

| Game | Link |
|------|------|
| 🖱️ Hive Mind Cursor | Massive multiplayer cursor battle |
| ❓ Guess Who? | 1v1 deduction card game |
| ⚡ Who's Better? | Reaction time battle |
| 📝 QuizMania | Multiplayer trivia quiz |
| 🟩 **Wordle Battle** | **This game!** |

---

## 📄 License

MIT — Free to use, modify, and distribute.
