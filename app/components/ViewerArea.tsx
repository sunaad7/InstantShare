"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Loader,
  ShieldAlert,
  MonitorUp,
} from "lucide-react";

interface ViewerAreaProps {
  remoteStream: MediaStream | null;
  connectionState: "disconnected" | "connecting" | "connected" | "error";
  hostName: string;
}

export default function ViewerArea({
  remoteStream,
  connectionState,
  hostName,
}: ViewerAreaProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
      setStreamActive(true);
      videoRef.current.play().catch(() => {
        setAutoplayBlocked(true);
        setIsMuted(true);
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      });
    } else {
      setStreamActive(false);
    }
  }, [remoteStream]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPaused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
    setIsPaused(!isPaused);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (autoplayBlocked) {
      setAutoplayBlocked(false);
      if (videoRef.current) videoRef.current.muted = false;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (v > 0) setIsMuted(false);
    else setIsMuted(true);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={containerRef}
        className="relative aspect-video bg-[#030305] border border-white/10 rounded-none overflow-hidden shadow-2xl flex items-center justify-center group"
      >
        {!streamActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#000000]/95 z-10 space-y-4">
            {connectionState === "connecting" ? (
              <>
                <div className="p-4 bg-white/5 border border-white/10 rounded-none animate-pulse">
                  <Loader className="h-8 w-8 text-white animate-spin" />
                </div>
                <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider text-sm font-mono">
                  Connecting to Room
                </h3>
                <p className="text-xs text-neutral-400 max-w-sm font-sans">
                  Establishing secure handshake with {hostName || "presenter"}
                  ...
                </p>
              </>
            ) : connectionState === "error" ? (
              <>
                <div className="p-4 bg-white/5 border border-white/20 rounded-none">
                  <ShieldAlert className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider text-sm font-mono">
                  Connection Failed
                </h3>
                <p className="text-xs text-neutral-400 max-w-sm font-sans">
                  Unable to connect to the presenter&apos;s room.
                </p>
              </>
            ) : (
              <>
                <div className="p-4 bg-white/5 border border-white/10 rounded-none">
                  <MonitorUp className="h-8 w-8 text-white animate-bounce" />
                </div>
                <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider text-sm font-mono">
                  Waiting for Screen Share
                </h3>
                <p className="text-xs text-neutral-400 max-w-sm font-sans">
                  Connected to {hostName || "Presenter"}. Waiting for them to
                  start casting.
                </p>
              </>
            )}
          </div>
        )}

        <video
          ref={videoRef}
          playsInline
          autoPlay
          className="w-full h-full object-contain"
        />

        {streamActive && autoplayBlocked && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-10 space-y-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-none">
              <VolumeX className="h-8 w-8 text-white" />
            </div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Stream is playing muted
            </h4>
            <p className="text-xs text-neutral-400 max-w-xs">
              Browsers block video sound until you interact. Click below to
              unmute.
            </p>
            <button
              onClick={toggleMute}
              className="bg-white hover:bg-neutral-200 text-black font-semibold py-2.5 px-6 rounded-none flex items-center gap-2 transition-colors text-xs uppercase tracking-wider shadow-lg cursor-pointer"
            >
              <Play className="h-4 w-4 fill-black" />
              <span>Unmute Audio</span>
            </button>
          </div>
        )}

        {isPaused && streamActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
            <button
              onClick={togglePlayPause}
              className="bg-black/80 border border-white/10 backdrop-blur-md p-4 rounded-none hover:bg-white/10 transition-all cursor-pointer"
            >
              <Play className="h-10 w-10 text-white fill-white" />
            </button>
          </div>
        )}

        {streamActive && !autoplayBlocked && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between z-20">
            <div className="flex items-center gap-4 bg-black/80 border border-white/10 backdrop-blur-md px-4 py-2 rounded-none">
              <button
                onClick={togglePlayPause}
                className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                title={isPaused ? "Play" : "Pause"}
              >
                {isPaused ? (
                  <Play className="h-5 w-5 text-white fill-white" />
                ) : (
                  <Pause className="h-5 w-5 text-white" />
                )}
              </button>
              <button
                onClick={toggleMute}
                className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5 text-white" />
                ) : (
                  <Volume2 className="h-5 w-5 text-white" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 accent-white h-1 bg-white/15 rounded-none appearance-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono bg-black/80 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-none text-gray-300">
                Presenter: {hostName || "Host"}
              </span>
              <button
                onClick={toggleFullscreen}
                className="bg-black/80 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white backdrop-blur-md p-2 rounded-none transition-all cursor-pointer"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {streamActive && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-none p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-none bg-white animate-pulse" />
            <span className="text-xs font-medium text-gray-300">
              Viewing Live Cast from {hostName}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleMute}
              className="flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              title={isMuted ? "Turn audio on" : "Turn audio off"}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              <span>{isMuted ? "Audio Off" : "Audio On"}</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
              <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
            </button>
            <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2.5 py-1.5 rounded-none border border-white/10">
              P2P WEBRTC &bull; DIRECT
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
