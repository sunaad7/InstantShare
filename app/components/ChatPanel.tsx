"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Send,
  Users,
} from "lucide-react";
import { ChatMessage, Participant } from "../types";

interface ChatPanelProps {
  messages: ChatMessage[];
  participants: Participant[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export default function ChatPanel({
  messages,
  participants,
  currentUserId,
  onSendMessage,
  isOpen,
  onToggleOpen,
}: ChatPanelProps) {
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`flex flex-col bg-[#0a0a0a] border border-white/10 rounded-none transition-all duration-300 ${
        isOpen ? "w-80 h-[calc(100vh-200px)]" : "w-12 h-12"
      }`}
    >
      {!isOpen ? (
        <button
          onClick={onToggleOpen}
          className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      ) : (
        <>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-white" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Chat
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-gray-500">
                {participants.length} online
              </span>
              <button
                onClick={onToggleOpen}
                className="text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-xs text-gray-600 font-mono">
                  No messages yet
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${
                  msg.isSystem
                    ? "text-center"
                    : msg.senderId === currentUserId
                      ? "text-right"
                      : ""
                }`}
              >
                {msg.isSystem ? (
                  <span className="text-[10px] text-gray-600 font-mono italic">
                    {msg.text}
                  </span>
                ) : (
                  <div
                    className={`inline-block max-w-[85%] ${
                      msg.senderId === currentUserId
                        ? "bg-white text-black"
                        : "bg-white/5 border border-white/10 text-gray-200"
                    } px-3 py-2 rounded-none`}
                  >
                    {msg.senderId !== currentUserId && (
                      <span className="block text-[10px] font-mono font-bold text-gray-400 mb-1">
                        {msg.senderName}
                      </span>
                    )}
                    <span className="text-xs leading-relaxed break-words">
                      {msg.text}
                    </span>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-white/10 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 bg-[#000] border border-white/10 rounded-none px-3 py-2 text-xs text-white font-sans outline-none focus:border-white transition-colors placeholder:text-gray-600"
              />
              <button
                onClick={handleSend}
                disabled={!text.trim()}
                className="bg-white disabled:bg-white/20 text-black disabled:text-gray-500 p-2 rounded-none transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
