import { useEffect, useRef } from 'react';

const RAW_BASE = import.meta?.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const API_BASE = RAW_BASE.replace(/\/api\/?$/, '');

function buildWsUrl(boardId) {
  const host = API_BASE.replace(/^https?:\/\//, '');
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${host}/ws/boards/${boardId}/`;
}

export default function useBoardSocket(boardId, { onMessage, token } = {}) {
  const wsRef = useRef(null);
  const reconnectRef = useRef({ attempts: 0, timeout: null });

  useEffect(() => {
    if (!boardId) return;
    let closed = false;

    let lastTimeout = null;

    const connect = () => {
      const url = buildWsUrl(boardId) + (token ? `?token=${encodeURIComponent(token)}` : '');
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectRef.current.attempts = 0;
      };

      ws.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          onMessage && onMessage(payload);
        } catch (err) {
          console.warn('Invalid WS payload', err);
        }
      };

      ws.onclose = () => {
        if (closed) return;
        // reconnect with backoff
        reconnectRef.current.attempts += 1;
        const t = Math.min(30000, 500 * reconnectRef.current.attempts);
        const to = setTimeout(connect, t);
        reconnectRef.current.timeout = to;
        lastTimeout = to;
      };

      ws.onerror = () => {
        // let close handler trigger reconnect
      };
    };

    connect();

    return () => {
      closed = true;
      // clear the timeout we created inside this effect (if any)
      if (lastTimeout) clearTimeout(lastTimeout);
      const wsNow = wsRef.current;
      if (wsNow) {
        try { wsNow.close(); } catch (err) { void err; }
      }
    };
  }, [boardId, token, onMessage]);

  return {
    send: (obj) => {
      try {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify(obj));
        }
      } catch { /* ignore */ }
    },
  };
}
