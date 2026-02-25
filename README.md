# TalkRooms200

A full-stack, real-time chat room application built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.IO for interactive messaging.

## 🚀 Features

- **Real-time Messaging** – Instant messages via Socket.IO.
- **Voice/Video Chat** – Peer-to-peer media communication using WebRTC.
- **User Authentication** – JWT-based signup/login with HTTP-only cookies.
- **Responsive UI** – Built with React 19 and Tailwind CSS v4.
- **Form Validation** – Schema-driven validation using Zod.
- **Security** – Password hashing (bcryptjs) and API rate limiting to prevent abuse.
- **Modular Architecture** – Clear separation between frontend, backend, and realtime logic.

## 🧰 Tech Stack

### Frontend
- React 19 with Hooks
- Vite for fast development
- Tailwind CSS v4
- React Router v7
- Socket.IO Client for websocket communication
- WebRTC API for peer-to-peer media streaming
- Axios for HTTP requests
- React Hot Toast for notifications
- Lucide React for icons

### Backend
- Node.js with Express.js v5
- MongoDB via Mongoose ODM
- Socket.IO server for live events
- JSON Web Tokens (JWT) for authentication
- Zod for request validation
- Bcrypt.js for password hashing

## 🌐 WebRTC, STUN, and TURN Servers

This application utilizes **WebRTC** for real-time audio/video communication. To establish peer-to-peer connections across different network topologies, STUN and TURN servers are involved:

- **STUN (Session Traversal Utilities for NAT):** Helps clients discover their public IP address so they can connect directly. Public STUN servers (like Google's `stun:stun.l.google.com:19302`) are often sufficient for basic usage.
- **TURN (Traversal Using Relays around NAT):** Acts as a fallback relay for media traffic when direct peer-to-peer connections fail due to strict NATs or firewalls. For production environments, it is highly recommended to configure a reliable TURN server (e.g., Coturn, Twilio, or Metered).

Ensure you configure your ICE servers (STUN/TURN) properly in the frontend WebRTC `RTCPeerConnection` setup for reliable connectivity.

## 📦 Prerequisites

- Node.js 18+ (LTS recommended)
- MongoDB instance (local or Atlas)

> Linux/Mac users: replace `npm` with `yarn` if preferred.

## 🛠️ Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd talkrooms200
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder with the following keys (example `.env.example` may be provided):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/talkrooms200
JWT_SECRET=your_secret_key
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Start the backend in development mode:

```bash
npm run dev
```

API documentation (endpoints) can be added here if available, else consult the `routes` directory.

### 3. Setup Frontend

Open a new terminal, then:

```bash
cd ../frontend
npm install
```

Optionally create a `.env` with frontend-specific settings (e.g. `VITE_API_URL`).

Start the development server:

```bash
npm run dev
```

The app should now be available at `http://localhost:5173` (or the port shown by Vite).

## 📄 Available Scripts

### Backend (`/backend`)
- `npm start` — run server with `node index.js`
- `npm run dev` — run with nodemon for hot reload

### Frontend (`/frontend`)
- `npm run dev` — launch Vite dev server
- `npm run build` — production build
- `npm run preview` — preview production build locally
- `npm run lint` — run ESLint

## 🧪 Testing

> No automated tests are included currently. Contributions welcome!

## 🗂️ Project Structure (high-level)

```
/backend          # backend logic, routes, models, sockets
/frontend         # React client source code
```

## 📝 Notes

- Ensure MongoDB is running before launching the backend.
- Use the same `FRONTEND_URL` in your backend `.env` when running locally to allow CORS.

## 📜 License

ISC

