import React, { useCallback, useState } from 'react';
import { FlashContext } from './flashContextValue.js';

export const FlashProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  const dismiss = useCallback((id) => {
    setMessages((s) => s.filter((m) => m.id !== id));
  }, []);

  const show = useCallback((text, type = 'info', ttl = 5000) => {
    const id = Date.now() + Math.random();
    const msg = { id, text, type };
    setMessages((s) => [...s, msg]);
    if (ttl > 0) {
      setTimeout(() => {
        setMessages((s) => s.filter((m) => m.id !== id));
      }, ttl);
    }
    return id;
  }, []);

  return (
    <FlashContext.Provider value={{ show, dismiss, messages }}>
      {children}
      <div style={{ position: 'fixed', right: 16, top: 16, zIndex: 9999 }}>
        {messages.map((m) => (
          <div key={m.id} className={`flash-message flash-${m.type}`} style={{ marginBottom: 8, minWidth: 240 }}>
            <div className="flash-text">{m.text}</div>
            <button className="flash-close" onClick={() => dismiss(m.id)} aria-label="Cerrar">×</button>
          </div>
        ))}
      </div>
    </FlashContext.Provider>
  );
};

export default FlashProvider;
