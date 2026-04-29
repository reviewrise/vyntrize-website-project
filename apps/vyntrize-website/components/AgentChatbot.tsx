'use client';

import { useEffect } from 'react';

export default function AgentChatbot() {
  useEffect(() => {
    const iframe = document.getElementById('agentops-chatbot-ab7b7522') as HTMLIFrameElement | null;
    if (!iframe) return;
    const onMessage = (event: MessageEvent) => {
      if (!event.data || event.source !== iframe.contentWindow) return;
      if (event.data.type !== 'agentops-chatbot-state') return;
      const open = Boolean(event.data.open);
      iframe.style.width = open ? '400px' : '80px';
      iframe.style.height = open ? 'min(820px, 100dvh)' : '80px';
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <iframe
      id="agentops-chatbot-ab7b7522"
      src="https://animator-briskness-canister.ngrok-free.dev/embed/chatbot?org=d7b14163-e1b2-47bd-9c99-225458dc3381"
      title="Booking assistant"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        width: 80,
        height: 80,
        maxWidth: 'calc(100vw - 32px)',
        border: 0,
        background: 'transparent',
        zIndex: 2147483647,
      }}
      loading="lazy"
    />
  );
}
