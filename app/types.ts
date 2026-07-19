export interface ChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export type AppRole = "host" | "viewer" | "undecided";

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
}

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type ShareType = "screen" | "video";

export type SignalingMessage =
  | { type: "create"; roomId: string }
  | { type: "created"; roomId: string }
  | { type: "join"; roomId: string; name: string }
  | { type: "joined"; viewerId: string; hostName: string }
  | { type: "error"; message: string }
  | { type: "viewer-joined"; viewerId: string; name: string }
  | { type: "viewer-left"; viewerId: string }
  | { type: "host-left" }
  | { type: "participants"; participants: Array<{ id: string; name: string }> }
  | { type: "offer"; offer: RTCSessionDescriptionInit; target?: string }
  | { type: "answer"; answer: RTCSessionDescriptionInit; viewerId?: string }
  | {
      type: "candidate";
      candidate: RTCIceCandidateInit;
      target?: string;
      viewerId?: string;
    }
  | {
      type: "chat-message";
      name: string;
      text: string;
      senderId: string;
      id?: string;
      timestamp?: string;
    };
