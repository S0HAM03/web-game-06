# 🟩 Wordle Battle — Multiplayer Word Race

A real-time multiplayer Wordle game where up to **4 players** race to solve the **same secret 5-letter word**. First to guess it wins!

Built with the same dark/neon aesthetic as the Soham Games Hub.

![Wordle Battle](https://img.shields.io/badge/Game-Wordle%20Battle-85b934?style=for-the-badge&logo=gamepad)
![Players](https://img.shields.io/badge/Players-1--4-a950ff?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Socket.io-00bfff?style=for-the-badge)

---

## 🎮 How to Play

1. **Create a Room** — Enter your name and create a lobby. You'll get a 4-character room code.
2. **Share the Code** — Share the code with up to 3 friends.
3. **Join the Lobby** — Other players enter the code to join.
4. **Host Starts the Game** — Once 2+ players are in, the host clicks **Start Game**.
5. **Race!** — Everyone gets the **same secret word**. Type your guesses and submit.
6. **Win!** — First player to correctly guess the word wins. All boards are revealed at the end.

### Tile Colors
| Color | Meaning |
|-------|---------|
| 🟩 Green | Correct letter, correct position |
| 🟨 Yellow | Letter is in the word, wrong position |
| ⬛ Gray | Letter is not in the word |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Server** | Node.js + Express + Socket.io |
| **Client** | React 19 + Vite |
| **Styling** | Vanilla CSS (dark neon design system) |
| **Icons** | Lucide React |
| **Real-time** | WebSockets via Socket.io |

---

## 📁 Project Structure

```
wordle-battle/
├── server/                  # Node.js backend
│   ├── index.js             # Express + Socket.io server (port 3005)
│   ├── gameLogic.js         # Room management, word evaluation, game state
│   ├── words.js             # 700+ word bank + extended valid guesses
│   ├── .env                 # Environment config (PORT, CORS origins)
│   └── package.json
│
└── client/                  # React frontend
    ├── src/
    │   ├── App.jsx           # Root component — screen router + socket listeners
    │   ├── socket.js         # Socket.io-client singleton
    │   ├── index.css         # Full dark design system
    │   ├── main.jsx          # React entry point
    │   └── screens/
    │       ├── LobbyScreen.jsx    # Create / Join room UI
    │       ├── WaitingScreen.jsx  # Lobby waiting room with live player list
    │       ├── GameScreen.jsx     # Wordle grid + keyboard + live scoreboard
    │       └── ResultScreen.jsx   # Winner reveal + all boards + play again
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
npm run dev
# Server runs on http://localhost:3005
```

### 3. Start the Client
```bash
cd client
npm install
npm run dev
# Client runs on http://localhost:5173
```

### 4. Play!
Open **http://localhost:5173** in multiple browser tabs or on different devices on the same network.

---

## 🌐 Deployment

### Server (e.g. Render, Railway, Fly.io)
Set the following environment variables:
```env
PORT=3005
CLIENT_ORIGIN=https://your-client-domain.com
```

### Client (e.g. Vercel, Netlify)
Create `client/.env.production`:
```env
VITE_SERVER_URL=https://your-server-domain.com
```

---

## ⚡ Features

- **Anti-cheat** — The secret word is **never sent to the client**. All guesses are validated server-side.
- **Live scoreboard** — See other players' attempt counts update in real-time (without revealing their letters).
- **Tile flip animations** — Smooth CSS flip animation on every submitted guess.
- **Shake animation** — Row shakes on invalid word or insufficient letters.
- **Keyboard coloring** — On-screen keyboard keys update to reflect correct/present/absent status.
- **Physical keyboard support** — Type with your real keyboard, full key support.
- **Confetti** — Winner gets a confetti burst on the result screen.
- **All boards revealed** — After game over, everyone's full Wordle board is shown.
- **Play Again** — Host can restart with a new word without leaving the lobby.
- **Disconnect handling** — If a player leaves mid-game, remaining players are notified and the game continues.
- **Host reassignment** — If the host disconnects in the lobby, the next player becomes host.

---

## 🔌 Socket Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `create_room` | `{ playerName }` | Create a new lobby |
| `join_room` | `{ playerName, roomCode }` | Join an existing lobby |
| `start_game` | — | Host starts the game |
| `submit_guess` | `{ guess }` | Submit a 5-letter guess |
| `play_again` | — | Host resets room for a new round |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `room_created` | `{ roomCode }` | Room successfully created |
| `room_joined` | `{ roomCode }` | Successfully joined room |
| `room_error` | `{ message }` | Error (room full, not found, etc.) |
| `player_list` | `[players]` | Updated player list |
| `game_start` | `{ wordLength, maxGuesses, playerList }` | Game begins |
| `guess_result` | `{ tiles, attempts, solved, eliminated }` | Result of your guess (private) |
| `guess_error` | `{ message }` | Invalid guess (not in word list) |
| `player_progress` | `[players]` | All players' attempt counts (broadcast) |
| `game_over` | `{ winnerId, word, playerBoards }` | Game ended |
| `rematch_ready` | `{ playerList }` | Room reset for new round |
| `player_left` | `{ playerList, newHostId }` | A player disconnected |

---

## 🎨 Part of Soham Games Hub

This game is part of the **Soham Games Hub** — a collection of free multiplayer web games.

- 🕹️ [Hive Mind Cursor](https://hivemindcursor.netlify.app/) — Massive multiplayer canvas battle
- ❓ [Guess Who?](https://guess-kon.vercel.app/) — 1v1 deduction game
- ⚡ [Who's Better?](https://whoisbetter.netlify.app/) — Reaction time battle
- 📝 [QuizMania](https://hivequiz.onrender.com/) — Multiplayer trivia quiz

---

## 📄 License

MIT — Free to use, modify, and distribute.
