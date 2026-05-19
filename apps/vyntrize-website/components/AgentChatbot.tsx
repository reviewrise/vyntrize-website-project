'use client';
import { useEffect } from "react";

export default function AgentChatbot() {
  useEffect(() => {
    const iframe = document.getElementById("ai-assistant-chatbot-4e550582") as HTMLIFrameElement | null;
    if (!iframe) return;
    const onMessage = (event: MessageEvent) => {
      if (!event.data || event.source !== iframe.contentWindow) return;
      if (event.data.type !== "ai-assistant-chatbot-state") return;
      const open = Boolean(event.data.open);
      iframe.style.width = open ? "400px" : "80px";
      iframe.style.height = open ? "min(820px, 100dvh)" : "80px";
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      id="ai-assistant-chatbot-4e550582"
      src="https://agent.vyntrise.com/embed/chatbot?org=4e550582-e07e-4be9-b733-b325a90417a3"
      title="Booking assistant"
      style={{
        position: "fixed", 
        right: 16,
        bottom: 16,
        width: 80,
        height: 80,
        maxWidth: "calc(100vw - 32px)",
        border: 0,
        background: "transparent",
        zIndex: 2147483647,  
      }}
      loading="lazy"
    />
  );
}