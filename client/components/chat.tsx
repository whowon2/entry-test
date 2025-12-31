"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, CheckCheck, ExternalLink } from "lucide-react";

interface Message {
  role: "user" | "model" | "system";
  content: string;
}

interface ChatAreaProps {
  ticketId: string | null;
  onTicketCreated: (id: string) => void;
}

export function ChatArea({ ticketId, onTicketCreated }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [transferData, setTransferData] = useState<{
    dept: string;
    summary: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load history when ticketId changes
  useEffect(() => {
    if (ticketId) {
      setLoading(true);
      fetch(`http://localhost:3001/api/messages/${ticketId}`)
        .then((res) => res.json())
        .then((data) => {
          setMessages(data);
          // Check if last message was a transfer system message to lock UI
          const lastMsg = data[data.length - 1];
          if (
            lastMsg?.role === "system" &&
            lastMsg.content.includes("Transferring")
          ) {
            // You might want to parse this better from backend metadata
            setTransferData({
              dept: "Existing Ticket",
              summary: "Already transferred",
            });
          } else {
            setTransferData(null);
          }
          setLoading(false);
        });
    } else {
      setMessages([]);
      setTransferData(null);
    }
  }, [ticketId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput("");

    // 1. Optimistic Update
    const tempMessages = [
      ...messages,
      { role: "user" as const, content: userText },
    ];
    setMessages(tempMessages);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, ticketId }),
        credentials: "include",
      });

      const data = await res.json();

      // 2. Handle First Message (New Ticket Created)
      if (!ticketId && data.ticketId) {
        onTicketCreated(data.ticketId);
      }

      // 3. Handle Transfer Action
      if (data.action === "TRANSFER") {
        setTransferData({
          dept: data.meta.department,
          summary: data.meta.summary,
        });
        setMessages((prev) => [
          ...prev,
          { role: "system", content: data.content },
        ]);
      } else {
        // Normal Reply
        setMessages((prev) => [
          ...prev,
          { role: "model", content: data.content },
        ]);
      }
    } catch (error) {
      console.error("Error sending message", error);
      // Rollback logic could go here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="h-16 border-b flex items-center px-6 justify-between bg-white">
        <div>
          <h1 className="font-semibold text-lg">Support Agent AI</h1>
          <p className="text-xs text-gray-500">
            {ticketId ? `Ticket #${ticketId.slice(0, 8)}` : "New Conversation"}
          </p>
        </div>
        {transferData && (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
            TRANSFERRED
          </span>
        )}
      </header>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Bot size={48} className="mb-4 text-gray-300" />
            <p>How can I help you today?</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] p-4 rounded-2xl shadow-sm text-sm ${
                msg.role === "user"
                  ? "bg-black text-white rounded-br-none"
                  : msg.role === "system"
                    ? "bg-yellow-50 border border-yellow-200 text-yellow-800 w-full max-w-full text-center"
                    : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"
              }`}
            >
              {msg.role !== "user" && msg.role !== "system" && (
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase">
                  <Bot size={12} /> Support Agent
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-100">
              <span className="animate-pulse text-gray-400 text-sm">
                Typing...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Transfer Success Screen Overlay (Optional) or just Input Area */}
      {transferData ? (
        <div className="p-6 bg-green-50 border-t border-green-100 text-center">
          <CheckCheck className="mx-auto text-green-600 mb-2" size={32} />
          <h3 className="font-bold text-green-900">Transfer Complete</h3>
          <p className="text-sm text-green-800 mb-2">
            You are now in queue for <strong>{transferData.dept}</strong>.
          </p>
          <p className="text-xs text-green-700 italic max-w-md mx-auto">
            "Summary sent to agent: {transferData.summary}"
          </p>
        </div>
      ) : (
        /* Input Area */
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 bg-gray-100 border-0 focus:ring-2 ring-black/10 rounded-xl px-4 py-3 outline-none transition-all disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-black text-white p-3 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
