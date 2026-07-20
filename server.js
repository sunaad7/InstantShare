const express = require("express");
const { createServer } = require("http");
const { WebSocketServer, WebSocket } = require("ws");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT, 10) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  const wss = new WebSocketServer({ noServer: true });

  const rooms = new Map();

  const sendJson = (ws, data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };

  const broadcastParticipants = (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const list = Array.from(room.viewers.entries()).map(([id, info]) => ({
      id,
      name: info.name,
    }));
    const payload = { type: "participants", participants: list };
    sendJson(room.hostSocket, payload);
    room.viewers.forEach((v) => sendJson(v.socket, payload));
  };

  wss.on("connection", (ws) => {
    let myRoomCode = null;
    let isHost = false;
    let myViewerId = null;

    ws.on("message", (raw) => {
      try {
        const data = JSON.parse(raw);

        switch (data.type) {
          case "create": {
            const { roomId } = data;
            myRoomCode = roomId;
            isHost = true;
            if (rooms.has(roomId)) {
              const old = rooms.get(roomId);
              old?.viewers.forEach((v) =>
                sendJson(v.socket, { type: "host-left" })
              );
            }
            rooms.set(roomId, { hostSocket: ws, viewers: new Map() });
            sendJson(ws, { type: "created", roomId });
            break;
          }

          case "join": {
            const { roomId, name } = data;
            myRoomCode = roomId;
            isHost = false;
            myViewerId = Math.random().toString(36).substring(2, 9);
            const room = rooms.get(roomId);
            if (!room) {
              sendJson(ws, {
                type: "error",
                message: "Room not found. Please check the code.",
              });
              return;
            }
            room.viewers.set(myViewerId, { socket: ws, name });
            sendJson(ws, {
              type: "joined",
              viewerId: myViewerId,
              hostName: "Presenter",
            });
            sendJson(room.hostSocket, {
              type: "viewer-joined",
              viewerId: myViewerId,
              name,
            });
            broadcastParticipants(roomId);
            break;
          }

          case "offer": {
            const { target, offer } = data;
            if (!myRoomCode) return;
            const room = rooms.get(myRoomCode);
            const viewer = room?.viewers.get(target);
            if (viewer) sendJson(viewer.socket, { type: "offer", offer });
            break;
          }

          case "answer": {
            const { answer, target } = data;
            if (!myRoomCode) return;
            const room = rooms.get(myRoomCode);
            if (room)
              sendJson(room.hostSocket, {
                type: "answer",
                viewerId: target || myViewerId,
                answer,
              });
            break;
          }

          case "candidate": {
            const { target, candidate } = data;
            if (!myRoomCode) return;
            const room = rooms.get(myRoomCode);
            if (!room) return;
            if (isHost) {
              const viewer = room.viewers.get(target);
              if (viewer)
                sendJson(viewer.socket, { type: "candidate", candidate });
            } else if (myViewerId) {
              sendJson(room.hostSocket, {
                type: "candidate",
                viewerId: myViewerId,
                candidate,
              });
            }
            break;
          }

          case "chat-message": {
            const { name, text, senderId } = data;
            if (!myRoomCode) return;
            const room = rooms.get(myRoomCode);
            if (!room) return;
            const msgPayload = {
              type: "chat-message",
              name,
              text,
              id: Math.random().toString(36).substring(2, 9),
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              senderId,
            };
            sendJson(room.hostSocket, msgPayload);
            room.viewers.forEach((v) => sendJson(v.socket, msgPayload));
            break;
          }
        }
      } catch (err) {
        console.error("WS Message Error:", err);
      }
    });

    ws.on("close", () => {
      if (!myRoomCode) return;
      const room = rooms.get(myRoomCode);
      if (!room) return;
      if (isHost) {
        room.viewers.forEach((v) =>
          sendJson(v.socket, { type: "host-left" })
        );
        rooms.delete(myRoomCode);
      } else if (myViewerId) {
        room.viewers.delete(myViewerId);
        sendJson(room.hostSocket, {
          type: "viewer-left",
          viewerId: myViewerId,
        });
        broadcastParticipants(myRoomCode);
      }
    });
  });

  httpServer.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(
      request.url || "",
      `http://${request.headers.host}`
    );
    if (pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  server.all("*", (req, res) => handle(req, res));

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
