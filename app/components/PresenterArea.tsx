"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Mic,
  MicOff,
  Power,
  Copy,
  Check,
  Users,
  QrCode,
  Pause,
  Play,
  Maximize2,
  Minimize2,
} from "lucide-react";
import QRCode from "qrcode";
import { ShareType } from "../types";

interface PresenterAreaProps {
  localStream: MediaStream | null;
  roomId: string;
  isMicMuted: boolean;
  participants: Array<{ id: string; name: string }>;
  onToggleMic: () => void;
  onStopShare: () => void;
  shareType: ShareType;
}

export default function PresenterArea({
  localStream,
  roomId,
  isMicMuted,
  participants,
  onToggleMic,
  onStopShare,
  shareType,
}: PresenterAreaProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [shareUrl, setShareUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(
        `${window.location.origin}${window.location.pathname}?room=${roomId}`
      );
    }
  }, [roomId]);

  useEffect(() => {
    if (shareUrl) {
      QRCode.toDataURL(shareUrl, {
        width: 200,
        margin: 2,
        color: { dark: "#ffffff", light: "#000000" },
      })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [shareUrl]);

  useEffect(() => {
    const interval = setInterval(
      () => setElapsedSeconds((p) => p + 1),
      1000
    );
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === previewRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPaused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
    setIsPaused(!isPaused);
  };

  const toggleFullscreen = () => {
    if (!previewRef.current) return;

    if (document.fullscreenElement === previewRef.current) {
      document.exitFullscreen().catch(console.error);
    } else {
      previewRef.current.requestFullscreen().catch(console.error);
    }
  };

  const hasAudioTrack = localStream
    ? localStream.getAudioTracks().length > 0
    : false;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-none p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-white opacity-75" />
                <span className="relative inline-flex rounded-none h-2 w-2 bg-white" />
              </span>
              <span className="text-xs font-mono font-bold text-white tracking-wider uppercase">
                {shareType === "screen"
                  ? "Live Screen Share"
                  : "Virtual Video Cast"}
              </span>
            </div>
            <h2 className="text-2xl font-display font-extrabold text-white">
              Your Screen is Being Shared
            </h2>
            <p className="text-xs text-gray-400 font-light">
              Direct WebRTC peer-to-peer screen capture.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
            <button
              onClick={onToggleMic}
              disabled={!hasAudioTrack}
              className={`flex-1 md:flex-none py-3 px-5 rounded-none font-medium text-sm flex items-center justify-center gap-2.5 transition-all ${
                !hasAudioTrack
                  ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                  : isMicMuted
                    ? "bg-neutral-900 border border-white/10 text-neutral-400 hover:bg-neutral-800"
                    : "bg-white text-black hover:bg-neutral-200"
              }`}
            >
              {isMicMuted || !hasAudioTrack ? (
                <>
                  <MicOff className="h-4 w-4 shrink-0 text-neutral-500" />
                  <span>Mic Off</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 shrink-0 text-black" />
                  <span>Mic On</span>
                </>
              )}
            </button>

            <button
              onClick={onStopShare}
              className="flex-1 md:flex-none bg-black hover:bg-neutral-900 text-white border border-white/30 hover:border-white font-semibold py-3 px-5 rounded-none text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer"
            >
              <Power className="h-4 w-4 shrink-0" />
              <span>Stop Share</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_auto] gap-6 mt-8 pt-6 border-t border-white/10 items-start">
          <div className="space-y-3 bg-white/[0.01] border border-white/10 rounded-none p-4">
            <span className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
              Share link with viewers
            </span>
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-[#000] border border-white/10 rounded-none text-xs py-2 px-3 text-white w-full font-mono outline-none focus:border-white"
            />
            <button
              onClick={copyToClipboard}
              className="bg-white hover:bg-neutral-200 text-black p-2 rounded-none transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold px-4 w-full cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white/[0.01] border border-white/10 rounded-none p-4 flex flex-col items-center justify-center">
            {qrDataUrl ? (
              <>
                <img
                  src={qrDataUrl}
                  alt="QR Code to join room"
                  className="w-36 h-36 rounded-none"
                />
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mt-2">
                  Scan to Join
                </span>
              </>
            ) : (
              <div className="w-36 h-36 bg-white/5 border border-white/10 rounded-none flex items-center justify-center">
                <QrCode className="h-8 w-8 text-gray-600" />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/[0.01] border border-white/10 rounded-none p-4 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Users className="h-3.5 w-3.5 text-white" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                  Viewers
                </span>
              </div>
              <span className="text-xl font-display font-bold text-white">
                {participants.length}
              </span>
            </div>
            <div className="bg-white/[0.01] border border-white/10 rounded-none p-4 flex flex-col justify-center">
              <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">
                Uptime
              </div>
              <span className="text-xl font-mono font-bold text-white">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
          </div>
      </div>

      <div
        ref={previewRef}
        className="relative aspect-video bg-[#030305] border border-white/10 rounded-none overflow-hidden shadow-2xl group"
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-contain"
        />
        <div className="absolute top-4 left-4 bg-black/80 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-none">
          <span className="text-[10px] font-mono text-gray-300 uppercase tracking-wider">
            Local Preview
          </span>
        </div>
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-20 bg-black/80 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white backdrop-blur-md p-2 rounded-none transition-all cursor-pointer"
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={togglePlayPause}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <div className="bg-black/80 border border-white/10 backdrop-blur-md p-3 rounded-none">
            {isPaused ? (
              <Play className="h-6 w-6 text-white fill-white" />
            ) : (
              <Pause className="h-6 w-6 text-white" />
            )}
          </div>
        </button>
      </div>

      {participants.length > 0 && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-none p-4">
          <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-3">
            Connected Viewers ({participants.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <div
                key={p.id}
                className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-none text-xs text-gray-300 font-mono"
              >
                {p.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
