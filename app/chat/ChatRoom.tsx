"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Monitor, AlertCircle, LogOut } from "lucide-react";
import { useSignaling } from "../lib/signaling";
import {
  createPeerConnection,
  hostCreateOffer,
  handleOffer,
  handleAnswer,
  handleCandidate,
} from "../lib/webrtc";
import Lobby from "../components/Lobby";
import PresenterArea from "../components/PresenterArea";
import ViewerArea from "../components/ViewerArea";
import ChatPanel from "../components/ChatPanel";
import {
  ChatMessage,
  Participant,
  ConnectionState,
  AppRole,
  ShareType,
} from "../types";

interface ChatRoomProps {
  initialRoomId?: string;
}

export default function ChatRoom({ initialRoomId }: ChatRoomProps) {
  const [role, setRole] = useState<AppRole>("undecided");
  const [roomId, setRoomId] = useState(initialRoomId || "");
  const [userName, setUserName] = useState("");
  const [myId, setMyId] = useState("");

  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [errorMessage, setErrorMessage] = useState("");

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [shareType, setShareType] = useState<ShareType>("screen");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatOpen, setChatOpen] = useState(true);
  const [isInIframe, setIsInIframe] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const viewerPcRef = useRef<RTCPeerConnection | null>(null);
  const roleRef = useRef<AppRole>("undecided");
  const roomIdRef = useRef(initialRoomId || "");
  const userNameRef = useRef("");
  const sendRef = useRef<(msg: any) => void>(() => {});

  const { connected, send, on } = useSignaling();
  sendRef.current = send;
  roleRef.current = role;
  roomIdRef.current = roomId;
  userNameRef.current = userName;

  useEffect(() => {
    return () => cleanup();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.self !== window.top) {
      setIsInIframe(true);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);

    pcsRef.current.forEach((pc) => {
      try { pc.close(); } catch {}
    });
    pcsRef.current.clear();

    if (viewerPcRef.current) {
      try { viewerPcRef.current.close(); } catch {}
      viewerPcRef.current = null;
    }

    setConnectionState("disconnected");
    setParticipants([]);
    setMessages([]);
  }, []);

  const addSystemMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        senderName: "System",
        senderId: "system",
        text,
        timestamp: Date.now(),
        isSystem: true,
      },
    ]);
  }, []);

  const handleExitRoom = useCallback(() => {
    cleanup();
    setRole("undecided");
    setRoomId("");
    setMyId("");
    window.history.pushState({}, "", "/chat");
  }, [cleanup]);

  const handleGoBackToLobby = useCallback(() => {
    cleanup();
    setRole("undecided");
    setRoomId("");
    setMyId("");
    window.history.pushState({}, "", "/chat");
  }, [cleanup]);

  // ── Register signaling handlers ONCE (refs avoid stale closures) ──
  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      on("created", () => {
        setConnectionState("connected");
        setRole("host");
        setParticipants([
          {
            id: "host",
            name: userNameRef.current || "Presenter",
            isHost: true,
            joinedAt: Date.now(),
          },
        ]);
        addSystemMessage(
          `System: Room created! Code: ${roomIdRef.current}`
        );
      })
    );

    unsubs.push(
      on("viewer-joined", (msg) => {
        addSystemMessage(`System: ${msg.name} connected.`);

        setParticipants((prev) => {
          if (prev.some((p) => p.id === msg.viewerId)) return prev;
          return [
            ...prev,
            {
              id: msg.viewerId,
              name: msg.name,
              isHost: false,
              joinedAt: Date.now(),
            },
          ];
        });

        if (streamRef.current) {
          const pc = createPeerConnection(
            () => {},
            (candidate) => {
              sendRef.current({
                type: "candidate",
                target: msg.viewerId,
                candidate,
              });
            }
          );
          pcsRef.current.set(msg.viewerId, pc);

          hostCreateOffer(pc, streamRef.current)
            .then((offer) => {
              sendRef.current({
                type: "offer",
                target: msg.viewerId,
                offer,
              });
            })
            .catch((err) =>
              console.error("Failed to create offer:", err)
            );
        }
      })
    );

    unsubs.push(
      on("answer", (msg) => {
        if (!msg.viewerId) return;
        const pc = pcsRef.current.get(msg.viewerId);
        if (pc) {
          handleAnswer(pc, msg.answer).catch((err) =>
            console.error("Failed to handle answer:", err)
          );
        }
      })
    );

    unsubs.push(
      on("candidate", (msg) => {
        if (roleRef.current === "host") {
          if (!msg.viewerId) return;
          const pc = pcsRef.current.get(msg.viewerId);
          if (pc)
            handleCandidate(pc, msg.candidate).catch((err) =>
              console.error("Host candidate error:", err)
            );
        } else {
          if (viewerPcRef.current) {
            handleCandidate(viewerPcRef.current, msg.candidate).catch(
              (err) => console.error("Viewer candidate error:", err)
            );
          }
        }
      })
    );

    unsubs.push(
      on("participants", (msg) => {
        setParticipants((prev) => {
          const hostEntry = prev.find((p) => p.isHost);
          const viewerParticipants = msg.participants.map((p) => ({
            id: p.id,
            name: p.name,
            isHost: false,
            joinedAt: Date.now(),
          }));
          return hostEntry
            ? [hostEntry, ...viewerParticipants]
            : viewerParticipants;
        });
      })
    );

    unsubs.push(
      on("chat-message", (msg) => {
        setMessages((prev) => [
          ...prev,
          {
            id: msg.id || Math.random().toString(36).substring(2, 9),
            senderName: msg.name,
            senderId: msg.senderId,
            text: msg.text,
            timestamp: Date.now(),
          },
        ]);
      })
    );

    unsubs.push(
      on("viewer-left", (msg) => {
        const pc = pcsRef.current.get(msg.viewerId);
        if (pc) {
          try { pc.close(); } catch {}
          pcsRef.current.delete(msg.viewerId);
        }
        setParticipants((prev) => {
          const left = prev.find((p) => p.id === msg.viewerId);
          if (left)
            addSystemMessage(`System: ${left.name} disconnected.`);
          return prev.filter((p) => p.id !== msg.viewerId);
        });
      })
    );

    unsubs.push(
      on("host-left", () => {
        addSystemMessage("System: Presenter stopped screen sharing.");
        cleanup();
        setRole("undecided");
      })
    );

    unsubs.push(
      on("error", (msg) => {
        setConnectionState("error");
        setErrorMessage(msg.message);
      })
    );

    unsubs.push(
      on("joined", (msg) => {
        setMyId(msg.viewerId);
        setConnectionState("connected");
        setRole("viewer");
        addSystemMessage("System: Connected successfully!");

        const pc = createPeerConnection(
          (stream) => {
            setRemoteStream(stream);
          },
          (candidate) => {
            sendRef.current({ type: "candidate", candidate });
          }
        );
        viewerPcRef.current = pc;
      })
    );

    unsubs.push(
      on("offer", (msg) => {
        if (viewerPcRef.current) {
          handleOffer(viewerPcRef.current, msg.offer)
            .then((answer) => {
              sendRef.current({ type: "answer", answer });
            })
            .catch((err) =>
              console.error("Failed to handle offer:", err)
            );
        }
      })
    );

    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── HOST: start sharing ──────────────────────────────────────────
  const startScreenShare = useCallback(
    async (
      presenterName: string,
      useMic: boolean,
      chosenShareType: ShareType = "screen"
    ) => {
      cleanup();
      setConnectionState("connecting");
      setUserName(presenterName);
      setShareType(chosenShareType);
      setMyId("host");

      try {
        let finalStream: MediaStream;

        if (chosenShareType === "screen") {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              displaySurface: "monitor",
              width: { ideal: 1920, max: 1920 },
              height: { ideal: 1080, max: 1080 },
              frameRate: { ideal: 30, max: 60 },
            },
            audio: true,
          });
          finalStream = screenStream;

          if (useMic) {
            try {
              const micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                },
              });
              const audioTracks: MediaStreamTrack[] = [];
              if (screenStream.getAudioTracks().length > 0) {
                audioTracks.push(...screenStream.getAudioTracks());
                audioTracks.push(...micStream.getAudioTracks());
              } else {
                audioTracks.push(...micStream.getAudioTracks());
              }
              finalStream = new MediaStream([
                ...screenStream.getVideoTracks(),
                ...audioTracks,
              ]);
            } catch {
              addSystemMessage(
                "System: Microphone capture failed. Sharing screen with video only."
              );
            }
          }

          screenStream.getVideoTracks()[0].onended = () =>
            handleExitRoom();
        } else {
          const file = await new Promise<File | null>((resolve) => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "video/*";
            input.onchange = () =>
              resolve(input.files?.[0] || null);
            input.click();
          });

          if (!file) {
            setConnectionState("disconnected");
            return;
          }

          const video = document.createElement("video");
          video.src = URL.createObjectURL(file);
          video.muted = true;
          video.loop = true;
          video.playsInline = true;

          await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => resolve();
            video.onerror = () =>
              reject(new Error("Failed to load video file."));
          });

          await video.play();

          const videoStream = (video as any).captureStream
            ? (video as any).captureStream(30)
            : (video as any).mozCaptureStream(30);

          if (useMic) {
            try {
              const micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                },
              });
              micStream
                .getAudioTracks()
                .forEach((t) => videoStream.addTrack(t));
            } catch {
              /* noop */
            }
          }

          finalStream = videoStream;
        }

        streamRef.current = finalStream;
        setLocalStream(finalStream);

        const generatedRoomId = Math.floor(
          100000 + Math.random() * 900000
        ).toString();
        setRoomId(generatedRoomId);
        roomIdRef.current = generatedRoomId;
        userNameRef.current = presenterName;

        send({ type: "create", roomId: generatedRoomId });
      } catch (err: any) {
        console.error("Screen share error:", err);
        setConnectionState("error");
        setErrorMessage(
          err.message || "Permission denied or capture failed."
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cleanup, addSystemMessage, send, handleExitRoom]
  );

  // ── HOST: send chat ─────────────────────────────────────────────
  const sendChatMessage = useCallback(
    (text: string) => {
      const chatMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        senderName: userNameRef.current,
        senderId: myId,
        text,
        timestamp: Date.now(),
      };

      if (role === "host") {
        setMessages((prev) => [...prev, chatMsg]);
      }
      send({
        type: "chat-message",
        name: userNameRef.current,
        text,
        senderId: myId,
      });
    },
    [role, myId, send]
  );

  // ── JOIN (viewer) ───────────────────────────────────────────────
  const joinScreenShare = useCallback(
    (viewerName: string, targetRoomId: string) => {
      cleanup();
      setConnectionState("connecting");
      setRoomId(targetRoomId);
      setUserName(viewerName);
      roomIdRef.current = targetRoomId;
      userNameRef.current = viewerName;
      send({ type: "join", roomId: targetRoomId, name: viewerName });
    },
    [cleanup, send]
  );

  const toggleMicMute = useCallback(() => {
    if (!streamRef.current) return;
    const audioTracks = streamRef.current.getAudioTracks();
    if (audioTracks.length > 0) {
      const isCurrentlyMuted = !audioTracks[0].enabled;
      audioTracks.forEach((t) => (t.enabled = isCurrentlyMuted));
      setIsMicMuted(!isCurrentlyMuted);
      addSystemMessage(
        `System: Microphone ${!isCurrentlyMuted ? "muted" : "unmuted"}`
      );
    }
  }, [addSystemMessage]);

  const isCapturePermissionError =
    errorMessage?.toLowerCase().includes("display-capture") ||
    errorMessage?.toLowerCase().includes("permission") ||
    errorMessage?.toLowerCase().includes("getdisplaymedia") ||
    errorMessage?.toLowerCase().includes("disallowed");

  const activeHostName =
    participants.find((p) => p.isHost)?.name || "Host";

  return (
    <div className="min-h-screen bg-[#000000] text-gray-100 font-sans selection:bg-white/20 selection:text-white relative">
      {isInIframe && (
        <div className="bg-white text-black text-center py-2.5 px-4 text-xs font-mono font-bold tracking-wider uppercase z-50 flex items-center justify-center gap-2 border-b border-white/20 shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0 text-black animate-pulse" />
          <span>
            Iframe detected. Screen sharing requires a standalone tab.
          </span>
          <button
            onClick={() =>
              window.open(
                window.location.href,
                "_blank",
                "noopener,noreferrer"
              )
            }
            className="underline ml-2 hover:text-neutral-700"
          >
            Open in New Tab
          </button>
        </div>
      )}

      {role === "undecided" && (
        <Lobby
          initialRoomId={roomId}
          onStartShare={startScreenShare}
          onJoinShare={joinScreenShare}
        />
      )}

      {connectionState === "error" && role === "undecided" && (
        <div className="min-h-screen flex items-center justify-center p-6 bg-black">
          <div className="max-w-md w-full bg-[#0a0a0a] border border-white/20 rounded-none p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-white" />
            <AlertCircle className="h-12 w-12 text-white mx-auto mb-4" />
            <h3 className="text-xl font-display font-bold text-white mb-2 uppercase tracking-wider text-sm font-mono">
              Connection Failed
            </h3>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed font-sans">
              {errorMessage}
            </p>

            {isCapturePermissionError && (
              <div className="my-4 p-4 bg-white/5 border border-white/10 text-left text-xs space-y-2 rounded-none">
                <p className="font-mono font-bold text-white uppercase tracking-wider">
                  Screen Capture Blocked
                </p>
                <p className="text-neutral-300 leading-relaxed font-sans">
                  Browsers only allow screen capture from a standalone tab or
                  window. Embedded previews and some in-app browsers deny
                  screen sharing before the peer connection can start.
                </p>
                <p className="text-white font-semibold font-sans">
                  To start sharing your screen:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-neutral-300 font-mono">
                  <li>Open this app in a normal browser tab.</li>
                  <li>
                    Click <strong className="text-white">Start Screen Share</strong> again and allow the browser prompt.
                  </li>
                </ol>
              </div>
            )}

            <div className="flex flex-col gap-3 mt-4">
              {isCapturePermissionError && (
                <button
                  onClick={() =>
                    window.open(
                      window.location.href,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                  className="w-full bg-white hover:bg-neutral-200 text-black font-semibold py-3 px-6 rounded-none transition-all cursor-pointer text-xs uppercase tracking-wider"
                >
                  Open in New Tab
                </button>
              )}
              <button
                onClick={handleGoBackToLobby}
                className="w-full bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold py-3 px-6 rounded-none transition-all cursor-pointer text-xs uppercase tracking-wider"
              >
                Back to Lobby
              </button>
            </div>
          </div>
        </div>
      )}

      {role !== "undecided" && connectionState !== "error" && (
        <div className="min-h-screen flex flex-col justify-between">
          <header className="bg-[#0a0a0a] border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-white rounded-none flex items-center justify-center shadow-md">
                <Monitor className="h-4 w-4 text-black" />
              </div>
              <div>
                <span className="font-display font-black text-sm text-white uppercase tracking-tight">
                  InstantShare
                </span>
                <span className="text-[9px] block text-neutral-400 font-mono tracking-wider leading-none mt-0.5">
                  ROOM ID: {roomId}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleExitRoom}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-4 py-2 rounded-none text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{role === "host" ? "End Cast" : "Leave Room"}</span>
              </button>
            </div>
          </header>

          <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-6 flex flex-col md:flex-row gap-6 items-stretch min-h-0">
            <div className="flex-grow min-w-0 flex flex-col gap-6 overflow-y-auto pr-1">
              {role === "host" ? (
                <PresenterArea
                  localStream={localStream}
                  roomId={roomId}
                  isMicMuted={isMicMuted}
                  participants={participants.filter((p) => !p.isHost)}
                  onToggleMic={toggleMicMute}
                  onStopShare={handleExitRoom}
                  shareType={shareType}
                />
              ) : (
                <ViewerArea
                  remoteStream={remoteStream}
                  connectionState={connectionState}
                  hostName={activeHostName}
                />
              )}
            </div>

            <div className="flex shrink-0">
              <ChatPanel
                messages={messages}
                participants={participants}
                currentUserId={myId}
                onSendMessage={sendChatMessage}
                isOpen={chatOpen}
                onToggleOpen={() => setChatOpen(!chatOpen)}
              />
            </div>
          </main>

          <footer className="border-t border-white/10 px-6 py-4 flex items-center justify-center bg-[#000] text-xs text-gray-500 font-mono gap-1.5">
            <span>Made with love by</span>
            <span className="font-semibold text-white underline decoration-white/20">
              Sunaad
            </span>
          </footer>
        </div>
      )}
    </div>
  );
}
