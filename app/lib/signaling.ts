"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SignalingMessage } from "../types";

type Handler<T = any> = (data: T) => void;

export function useSignaling() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef<Map<string, Set<Handler>>>(new Map());
  const queueRef = useRef<SignalingMessage[]>([]);

  const on = useCallback(
    <K extends string>(
      type: K,
      handler: Handler<Extract<SignalingMessage, { type: K }>>
    ) => {
      if (!handlersRef.current.has(type)) {
        handlersRef.current.set(type, new Set());
      }
      handlersRef.current.get(type)!.add(handler);

      return () => {
        handlersRef.current.get(type)?.delete(handler);
      };
    },
    []
  );

  const emit = useCallback((type: string, data?: any) => {
    handlersRef.current.get(type)?.forEach((h) => h(data));
  }, []);

  const flushQueue = useCallback(() => {
    while (queueRef.current.length > 0) {
      const msg = queueRef.current.shift()!;
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(msg));
      }
    }
  }, []);

  const connect = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    )
      return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws`
    );
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      flushQueue();
    };

    ws.onclose = () => {
      setConnected(false);
      setTimeout(connect, 2000);
    };

    ws.onerror = () => ws.close();

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as SignalingMessage;
        emit(msg.type, msg);
      } catch {}
    };
  }, [emit, flushQueue]);

  const send = useCallback(
    (msg: SignalingMessage) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(msg));
      } else {
        queueRef.current.push(msg);
      }
    },
    []
  );

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connected, send, on, connect, disconnect };
}
