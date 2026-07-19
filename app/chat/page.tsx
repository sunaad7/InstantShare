"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ChatRoom from "./ChatRoom";

function ChatPageInner() {
  const searchParams = useSearchParams();
  const room = searchParams.get("room") || undefined;

  return <ChatRoom initialRoomId={room} />;
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <span className="text-sm text-gray-500 font-mono">Loading...</span>
        </div>
      }
    >
      <ChatPageInner />
    </Suspense>
  );
}
