# char-editor

A web app for managing Pathfinder 2e characters, custom feats, and combat encounter sessions. Built with React + Vite on the frontend and an Express + MongoDB backend, with Google OAuth for authentication.

## Features

- **Character Editor** — Create and edit Pathfinder 2e characters including stats, skills, feats, class features, and equipment
- **Custom Feats** — Define and manage homebrew or custom feats per user
- **Initiative Tracker** — Run combat encounters, manage combatants, and track session history
- **Google OAuth** — Sign in with Google; all data is scoped per user
- **Dark / Light theme** — Persistent theme toggle

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Base UI, dnd-kit |
| Backend | Node.js, Express 5, TypeScript, Passport.js (Google OAuth) |
| Database | MongoDB via Mongoose, connect-mongo for sessions |
| Testing | Playwright (end-to-end) |

## Prerequisites

- Node.js 18+
- npm 9+ (workspaces support required)
- A running MongoDB instance (local or Atlas)
- A Google Cloud project with OAuth 2.0 credentials

## Installation

```bash
# Clone the repo
git clone <repo-url>
cd char-editor

# Install all dependencies (client + server)
npm install
```

## Environment Variables

Create a `.env` file inside the `server/` directory:

```env
# MongoDB connection string
MONGO_URI=mongodb://localhost:27017/char-editor

# Express session secret — use a long random string in production
SESSION_SECRET=your_session_secret

# Google OAuth credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# URL the server redirects back to after OAuth (must match Google Console)
# Defaults to http://localhost:5173 in development
CLIENT_URL=http://localhost:5173

# Server port (defaults to 3001)
PORT=3001

# Set to "production" when deploying
NODE_ENV=development
```

### Getting Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select an existing one)
3. Navigate to **APIs & Services → Credentials**
4. Create an **OAuth 2.0 Client ID** (application type: Web)
5. Add `http://localhost:3001/auth/google/callback` to the **Authorised redirect URIs**
6. Copy the Client ID and Client Secret into your `.env`

## Running in Development

```bash
# Start both the API server (port 3001) and the Vite dev server (port 5173) concurrently
npm run dev
```

Or start each separately:

```bash
npm run dev:server   # Express API with ts-node-dev (hot reload)
npm run dev:client   # Vite dev server
```

## Seeding the Database

```bash
npm run seed --workspace=server
```

## Building for Production

```bash
npm run build        # Compiles server TypeScript and bundles the client
npm start            # Serves the compiled app from server/dist/index.js
```

## Running Tests

End-to-end tests use Playwright. Both dev servers must be reachable (or Playwright will start them automatically via `webServer` config).

```bash
npm run test:e2e          # Run all e2e tests (headless)
npm run test:e2e:ui       # Open Playwright UI mode
npm run test:e2e:report   # Show the last HTML report
```

## Project Structure

```
char-editor/
├── client/               # React + Vite frontend
│   └── src/
│       ├── components/   # Shared UI components (Sidebar, FeatAutocomplete)
│       ├── pages/        # Route-level page components
│       │   └── initiative-tracker/
│       ├── data/         # Static game data (feats, class features)
│       ├── types/        # TypeScript type definitions
│       └── utils/        # Helper functions
├── server/               # Express API backend
│   └── src/
│       ├── models/       # Mongoose models (User, Character, CustomFeat, EncounterSession)
│       └── rules/        # Game-rules logic
├── e2e/                  # Playwright end-to-end tests
└── package.json          # Root workspace manifest
```
