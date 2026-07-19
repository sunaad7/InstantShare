"use client";

import React, { useState } from "react";
import { Monitor, Users, Mic, MicOff } from "lucide-react";
import { ShareType } from "../types";

interface LobbyProps {
  initialRoomId: string;
  onStartShare: (
    name: string,
    useMic: boolean,
    shareType: ShareType
  ) => void;
  onJoinShare: (name: string, roomId: string) => void;
}

export default function Lobby({
  initialRoomId,
  onStartShare,
  onJoinShare,
}: LobbyProps) {
  const [activeTab, setActiveTab] = useState<"share" | "join">(
    initialRoomId ? "join" : "share"
  );
  const [name, setName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState(initialRoomId);
  const [useMic, setUseMic] = useState(false);
  const [shareType, setShareType] = useState<ShareType>("screen");
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onStartShare(name.trim(), useMic, shareType);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = () => {
    if (!name.trim() || !joinRoomId.trim()) return;
    onJoinShare(name.trim(), joinRoomId.trim());
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white rounded-none flex items-center justify-center shadow-lg shadow-black/50">
            <Monitor className="h-5 w-5 text-black" />
          </div>
          <div>
            <span className="font-display font-black text-xl tracking-tight text-white uppercase">
              InstantShare
            </span>
            <span className="text-[9px] block text-neutral-400 font-mono tracking-[0.2em] uppercase">
              P2P WebRTC
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-gray-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Sign-up Free &bull; Direct Connection
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-12">
            <span className="inline-block text-xs uppercase tracking-[0.2em] font-mono font-semibold text-neutral-300 mb-3 bg-white/5 px-3.5 py-1 rounded-none border border-white/10">
              Zero Installations &bull; Full Privacy
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight text-white mt-4 mb-6 leading-none">
              Share. <span className="underline decoration-white/20 underline-offset-8">Instantly.</span>
            </h1>
            <p className="text-gray-400 text-lg font-light leading-relaxed max-w-xl mx-auto">
              Create a peer-to-peer screen sharing room. Share the link with anyone. No accounts needed.
            </p>
          </div>

          <div className="flex gap-0 max-w-2xl mx-auto mb-8 border border-white/10">
            <button
              onClick={() => setActiveTab("share")}
              className={`flex-1 py-3.5 text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                activeTab === "share"
                  ? "bg-white text-black"
                  : "bg-transparent text-gray-500 hover:text-white"
              }`}
            >
              <Monitor className="h-4 w-4 inline mr-2" />
              Share My Screen
            </button>
            <button
              onClick={() => setActiveTab("join")}
              className={`flex-1 py-3.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-l border-white/10 ${
                activeTab === "join"
                  ? "bg-white text-black"
                  : "bg-transparent text-gray-500 hover:text-white"
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Join a Room
            </button>
          </div>

          <div className="max-w-md mx-auto space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-none px-4 py-3 text-sm text-white font-sans outline-none focus:border-white transition-colors placeholder:text-gray-600"
              />
            </div>

            {activeTab === "share" ? (
              <>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Share Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["screen", "video"] as ShareType[]).map(
                      (type) => (
                        <button
                          key={type}
                          onClick={() => setShareType(type)}
                          className={`py-2.5 text-xs font-mono font-bold uppercase tracking-wider border transition-all ${
                            shareType === type
                              ? "bg-white text-black border-white"
                              : "bg-transparent text-gray-500 border-white/10 hover:border-white/30"
                          }`}
                        >
                          {type}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-[#0a0a0a] border border-white/10 px-4 py-3">
                  <span className="text-xs text-gray-400 font-sans">
                    Include microphone
                  </span>
                  <button
                    onClick={() => setUseMic(!useMic)}
                    className={`p-2 transition-all ${
                      useMic
                        ? "bg-white text-black"
                        : "bg-white/10 text-gray-500"
                    }`}
                  >
                    {useMic ? (
                      <Mic className="h-4 w-4" />
                    ) : (
                      <MicOff className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <button
                  onClick={handleShare}
                  disabled={!name.trim() || loading}
                  className="w-full bg-white hover:bg-neutral-200 disabled:bg-white/20 disabled:text-gray-500 text-black font-bold py-4 rounded-none text-sm uppercase tracking-wider transition-all shadow-lg cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Starting...
                    </>
                  ) : (
                    "Start Screen Share"
                  )}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    placeholder="Enter 6-digit room code"
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-none px-4 py-3 text-sm text-white font-mono outline-none focus:border-white transition-colors placeholder:text-gray-600"
                    maxLength={6}
                  />
                </div>

                <button
                  onClick={handleJoin}
                  disabled={!name.trim() || !joinRoomId.trim()}
                  className="w-full bg-white hover:bg-neutral-200 disabled:bg-white/20 disabled:text-gray-500 text-black font-bold py-4 rounded-none text-sm uppercase tracking-wider transition-all shadow-lg cursor-pointer disabled:cursor-not-allowed"
                >
                  Join Room
                </button>
              </>
            )}
          </div>

          <div className="max-w-4xl mx-auto mt-16 p-6 rounded-none bg-white/[0.01] border border-white/10">
            <h3 className="text-sm font-semibold text-white mb-4">
              How does it work?
            </h3>
            <div className="grid sm:grid-cols-3 gap-6 text-xs text-gray-400">
              <div>
                <span className="font-semibold text-white block mb-1">
                  1. Click Share
                </span>
                Configure your preferences and start sharing. A room code is generated instantly.
              </div>
              <div>
                <span className="font-semibold text-white block mb-1">
                  2. Send Link
                </span>
                Copy and share the room URL. Viewers connect directly to you via WebRTC.
              </div>
              <div>
                <span className="font-semibold text-white block mb-1">
                  3. Talk &amp; Chat
                </span>
                Stream your screen with crystal-clear quality and interact via built-in chat.
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl w-full mx-auto px-6 py-8 text-center border-t border-white/5">
        <p className="text-xs text-gray-500 font-light">
          &copy; {new Date().getFullYear()} InstantShare. Secured via standard
          WebRTC end-to-end transport.
        </p>
      </footer>
    </div>
  );
}
