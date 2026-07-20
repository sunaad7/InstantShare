# InstantShare

InstantShare is a lightweight, browser-based way to share a screen or camera feed with anyone using a room link. Create a room, send the generated URL or six-digit code, and viewers can join directly from their browser—no account or installation required.

## Features

- **Instant rooms** — create a share room in one click.
- **Screen or camera sharing** — choose between a display capture and a video feed.
- **Optional microphone audio** — include microphone input when starting a share.
- **Shareable links and QR codes** — make it easy for viewers to join.
- **Real-time chat** — communicate with people in the room while presenting.
- **Participant list** — see who is currently connected.
- **Fullscreen viewer** — give viewers a clean, focused viewing experience.
- **No accounts** — join with a display name and a room code or link.

## How it works

1. A presenter creates a room and selects what to share.
2. The app generates a room code and a shareable URL.
3. Viewers open the link (or enter the code) and join the room.
4. The server relays WebRTC setup messages; the audio/video stream is sent directly between the presenter and viewers when the network allows it.

The Express/WebSocket server is used for room coordination, participant updates, and chat messages. Media is handled by the browser’s WebRTC APIs.

## Run locally

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- A modern browser with screen-sharing support (Chrome, Edge, Firefox, or Safari)

### Setup

```bash
git clone https://github.com/sunaad7/InstantShare.git
cd InstantShare
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server at port 3000. |
| `npm run build` | Create a production build. |
| `npm start` | Run the production server. |
| `npm run lint` | Run the project linter. |

## Deployment

The project includes a [`render.yaml`](render.yaml) blueprint for deployment on Render. Any host must support long-lived WebSocket connections because room signalling and chat use the `/ws` endpoint.

For public use, serve the app over HTTPS. Browsers require a secure context for screen capture outside of `localhost`.

## Tech stack

- Next.js 15 and React 19
- Express
- WebSocket (`ws`)
- WebRTC browser APIs
- TypeScript and Tailwind CSS

## Notes

- Rooms exist only in the running server’s memory. Restarting or redeploying the server clears active rooms.
- This project does not include a TURN server. Some restrictive networks may prevent direct WebRTC connections; adding TURN credentials is recommended for production reliability.
- Screen and microphone access are always requested by the browser and must be approved by the presenter.
